import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import Chart from 'chart.js/auto';
import * as ExcelJS from 'exceljs';
import { generateSystemEvents, SystemEvent } from './data-generator';
import * as stats from './statistics';
import { FrequencyDistribution } from './statistics';

type StatsResults = {
  mean: number; median: number; mode: number[]; variance: number;
  stdDev: number; range: number; cv: number; totalErrors: number;
}

const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const tableContainer = document.getElementById('table-container') as HTMLDivElement;
const resultsOutput = document.getElementById('results-output') as HTMLDivElement;
const reportOutput = document.getElementById('report-output') as HTMLDivElement;
const mainChartCanvas = document.getElementById('chart') as HTMLCanvasElement;
const errorDistCanvas = document.getElementById('error-dist-chart') as HTMLCanvasElement;
const statusCodeCanvas = document.getElementById('status-code-chart') as HTMLCanvasElement;
const scatterPlotCanvas = document.getElementById('scatter-plot-chart') as HTMLCanvasElement;
const freqTablesOutput = document.getElementById('frequency-tables-output') as HTMLDivElement;

let mainChart: Chart | null = null;
let errorDistChart: Chart | null = null;
let statusCodeChart: Chart | null = null;
let scatterPlotChart: Chart | null = null;

let latestEvents: SystemEvent[] = [];
let latestResults: StatsResults | null = null;
let latestFreqTables: { [key: string]: FrequencyDistribution[] } = {};

function renderTable(events: SystemEvent[]) {
  let tableHTML = '<table class="table table-sm table-striped table-hover"><thead><tr><th>ID</th><th>Serviço</th><th>Timestamp</th><th>Resposta (ms)</th><th>Status</th><th>Erro</th></tr></thead><tbody>';
  for (const event of events) {
    tableHTML += `<tr class="${event.error ? 'table-danger' : ''}"><td>${event.id}</td><td>${event.serviceName}</td><td>${event.timestamp.toLocaleTimeString()}</td><td>${event.responseTime_ms}</td><td>${event.statusCode}</td><td>${event.error ? 'Sim' : 'Não'}</td></tr>`;
  }
  tableHTML += '</tbody></table>';
  tableContainer.innerHTML = tableHTML;
}

function renderStatistics(results: StatsResults) {
  resultsOutput.innerHTML = `
    <table class="table table-hover"><tbody>
      <tr><td><strong>Média</strong></td><td>${results.mean.toFixed(2)} ms</td></tr>
      <tr><td><strong>Mediana</strong></td><td>${results.median.toFixed(2)} ms</td></tr>
      <tr><td><strong>Moda</strong></td><td>${results.mode.length > 0 ? results.mode.join(', ') : 'Amodal'}</td></tr>
      <tr><td><strong>Desvio Padrão</strong></td><td>${results.stdDev.toFixed(2)} ms</td></tr>
      <tr><td><strong>Coef. de Variação</strong></td><td>${results.cv.toFixed(2)}%</td></tr>
      <tr><td><strong>Total de Erros</strong></td><td>${results.totalErrors}</td></tr>
    </tbody></table>
  `;
}

function destroyCharts() {
  if (mainChart) mainChart.destroy();
  if (errorDistChart) errorDistChart.destroy();
  if (statusCodeChart) statusCodeChart.destroy();
  if (scatterPlotChart) scatterPlotChart.destroy();
}

function renderFrequencyTable(title: string, data: FrequencyDistribution[], categoryTitle: string) {
  let tableHTML = `
    <div class="col-lg-4 col-md-6 mb-4">
      <h5>${title}</h5>
      <table class="table table-bordered table-sm table-striped"> 
        <thead class="thead-light">
          <tr>
            <th>${categoryTitle}</th>
            <th>Fi</th>
            <th>Fri</th>
            <th>Fri %</th>
            <th>Acum %</th>
          </tr>
        </thead>
        <tbody>`;

  const sortedData = [...data].sort((a, b) => b.fi - a.fi);

  for (const row of sortedData) {
    tableHTML += `
      <tr>
        <td>${row.classOrCategory}</td>
        <td>${row.fi}</td>
        <td>${row.fri.toFixed(4)}</td>
        <td>${row.friPercent}</td>
        <td>${row.acumPercent}</td>
      </tr>`;
  }

  tableHTML += '</tbody></table></div>';
  return tableHTML;
}

function renderMainChart(freqData: FrequencyDistribution[]) {
  const labels = freqData.map(d => d.classOrCategory);
  const data = freqData.map(d => d.fi);

  mainChart = new Chart(mainChartCanvas, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'Frequência', data: data, backgroundColor: 'rgba(0, 123, 255, 0.5)' }] },
    options: { plugins: { title: { display: true, text: 'Histograma de Tempos de Resposta' } } }
  });
}

function renderErrorDistributionChart(events: SystemEvent[]) {
  const errorsByService = events.filter(e => e.error).reduce((acc, e) => {
    acc[e.serviceName] = (acc[e.serviceName] || 0) + 1;
    return acc;
  }, {} as Record<SystemEvent['serviceName'], number>);

  errorDistChart = new Chart(errorDistCanvas, {
    type: 'pie',
    data: {
      labels: Object.keys(errorsByService),
      datasets: [{
        label: 'Erros',
        data: Object.values(errorsByService),
        backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#6f42c1']
      }]
    },
    options: { plugins: { title: { display: true, text: 'Distribuição de Erros por Serviço' } } }
  });
}

function renderStatusCodeChart(events: SystemEvent[]) {
  const statusCounts = events.reduce((acc, e) => {
    acc[e.statusCode] = (acc[e.statusCode] || 0) + 1;
    return acc;
  }, {} as Record<SystemEvent['statusCode'], number>);

  statusCodeChart = new Chart(statusCodeCanvas, {
    type: 'bar',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Contagem',
        data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusCounts).map(code => String(code).startsWith('2') ? '#28a745' : '#dc3545')
      }]
    },
    options: { indexAxis: 'y', plugins: { title: { display: true, text: 'Contagem por Código de Status' }, legend: { display: false } } }
  });
}

function renderScatterPlotChart(events: SystemEvent[]) {
  const scatterData = events.map(event => ({
    x: event.id,
    y: event.responseTime_ms
  }));

  scatterPlotChart = new Chart(scatterPlotCanvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Tempo de Resposta',
        data: scatterData,
        backgroundColor: events.map(e => e.error ? '#dc3545' : 'rgba(0, 123, 255, 0.5)')
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Dispersão: ID do Evento vs. Tempo de Resposta' }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'ID do Evento'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Tempo de Resposta (ms)'
          }
        }
      }
    }
  });
}

function renderReport(results: StatsResults, events: SystemEvent[]) {
  let interpretation = '';
  if (results.cv <= 15) interpretation = 'Os tempos de resposta são <strong>homogêneos</strong>, indicando um sistema estável.';
  else if (results.cv > 15 && results.cv <= 30) interpretation = 'Os tempos de resposta têm <strong>dispersão moderada</strong>, sugerindo alguma variabilidade que pode ser normal.';
  else interpretation = 'Os tempos de resposta são <strong>heterogêneos</strong>, indicando instabilidade ou a presença de outliers significativos que precisam de investigação.';

  const errorsByService = events.filter(e => e.error).reduce((acc, e) => {
    acc[e.serviceName] = (acc[e.serviceName] || 0) + 1;
    return acc;
  }, {} as Record<SystemEvent['serviceName'], number>);
  const mostProblematicService = Object.entries(errorsByService).sort((a, b) => b[1] - a[1])[0];

  reportOutput.innerHTML = `
    <h5>Interpretação</h5>
    <p>${interpretation}</p>
    <hr/>
    <h5>Padrões Identificados</h5>
    <ul>
      <li>O sistema processou <strong>${events.length}</strong> eventos, com <strong>${results.totalErrors}</strong> falhas (taxa de erro de <strong>${(results.totalErrors / events.length * 100).toFixed(2)}%</strong>).</li>
      ${mostProblematicService ? `<li>O serviço mais problemático foi o <strong>${mostProblematicService[0]}</strong>, com <strong>${mostProblematicService[1]}</strong> erros.</li>` : '<li>Nenhum erro foi registrado.</li>'}
    </ul>
    <hr/>
    <h5>Sugestões</h5>
    <p>${mostProblematicService ? `Recomenda-se focar a investigação no <strong>${mostProblematicService[0]}</strong> para identificar a causa raiz das falhas.` : 'O sistema está operando com estabilidade e sem erros. Otimizações podem focar em performance geral.'}</p>
  `;
}

function runAnalysis() {
  destroyCharts();
  freqTablesOutput.innerHTML = '';
  const events = generateSystemEvents(300);
  renderTable(events);

  const responseTimes = events.map(e => e.responseTime_ms);
  const mean = stats.calculateMean(responseTimes);
  const median = stats.calculateMedian(responseTimes);
  const mode = stats.calculateMode(responseTimes);
  const variance = stats.calculateVariance(responseTimes, mean);
  const stdDev = stats.calculateStdDev(variance);
  const range = stats.calculateRange(responseTimes);
  const cv = stats.calculateCV(stdDev, mean);
  const totalErrors = events.filter(e => e.error).length;
  const results: StatsResults = { mean, median, mode, variance, stdDev, range, cv, totalErrors };

  const responseTimeFreq = stats.calculateFrequencyDistribution(responseTimes, false, 12);
  const services = events.map(e => e.serviceName);
  const serviceFreq = stats.calculateFrequencyDistribution(services, true);
  const statusCodes = events.map(e => e.statusCode);
  const statusCodeFreq = stats.calculateFrequencyDistribution(statusCodes, true);
  const errorEvents = events.filter(e => e.error).map(e => e.serviceName);
  const errorServiceFreq = stats.calculateFrequencyDistribution(errorEvents, true);

  renderStatistics(results);
  renderMainChart(responseTimeFreq);
  renderErrorDistributionChart(events);
  renderStatusCodeChart(events);
  renderScatterPlotChart(events);
  renderReport(results, events);

  freqTablesOutput.innerHTML += renderFrequencyTable('Tempos de Resposta (ms)', responseTimeFreq, 'Classe');
  freqTablesOutput.innerHTML += renderFrequencyTable('Serviços Acessados', serviceFreq, 'Serviço');
  freqTablesOutput.innerHTML += renderFrequencyTable('Códigos de Status', statusCodeFreq, 'Código');

  latestEvents = events;
  latestResults = results;
  latestFreqTables = {
    'Tempos de Resposta (ms)': responseTimeFreq,
    'Serviços Acessados': serviceFreq,
    'Códigos de Status': statusCodeFreq,
    'Erros por Serviço': errorServiceFreq
  };
}

async function exportToExcel() {
  if (!latestEvents.length || !latestResults) {
    alert('Por favor, gere os dados primeiro clicando no botão "Gerar e Analisar Dados".');
    return;
  }

  exportBtn.textContent = 'Gerando Excel...';
  exportBtn.disabled = true;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DataCESUCA';
  workbook.created = new Date();
  workbook.lastModifiedBy = 'DataCESUCA';

  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
  const subHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
  const whiteFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 12, color: { argb: 'FFFFFFFF' }, bold: true };
  const boldFont: Partial<ExcelJS.Font> = { name: 'Calibri', bold: true };

  const dashboardSheet = workbook.addWorksheet('Dashboard');
  dashboardSheet.addRow(['Painel de Análise de Sistema - DataCESUCA']).getCell(1).font = { name: 'Calibri', size: 16, bold: true };
  dashboardSheet.mergeCells('A1:E1');
  dashboardSheet.getRow(1).height = 30;
  dashboardSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  dashboardSheet.addRow([]);

  const statsHeaderRow = dashboardSheet.addRow(['Sumário Estatístico']);
  statsHeaderRow.getCell(1).fill = headerFill;
  statsHeaderRow.getCell(1).font = whiteFont;
  dashboardSheet.mergeCells('A3:B3');

  const statsData = [
    ['Média', latestResults.mean],
    ['Mediana', latestResults.median],
    ['Moda', latestResults.mode.join(', ') || 'Amodal'],
    ['Desvio Padrão', latestResults.stdDev],
    ['Coef. de Variação', latestResults.cv / 100],
    ['Total de Eventos', latestEvents.length],
    ['Total de Erros', latestResults.totalErrors],
  ];

  statsData.forEach(data => {
    const row = dashboardSheet.addRow(data);
    const cell1 = row.getCell(1);
    const cell2 = row.getCell(2);
    cell1.font = boldFont;
    cell2.alignment = { horizontal: 'right' };
    cell2.numFmt = data[0] === 'Coef. de Variação' ? '0.00%' : '0.00';
  });

  dashboardSheet.getColumn(1).width = 20;
  dashboardSheet.getColumn(2).width = 20;

  dashboardSheet.addRow([]);

  const reportHeaderRow = dashboardSheet.addRow(['Relatório de Inteligência']);
  reportHeaderRow.getCell(1).fill = headerFill;
  reportHeaderRow.getCell(1).font = whiteFont;
  dashboardSheet.mergeCells('A12:E12');
  
  const interpretationTitle = dashboardSheet.addRow(['Interpretação']);
  interpretationTitle.getCell(1).font = boldFont;
  dashboardSheet.mergeCells(interpretationTitle.number, 1, interpretationTitle.number, 5);
  const interpretationCell = dashboardSheet.addRow([reportOutput.querySelector('p')?.innerText || '']);
  interpretationCell.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  dashboardSheet.mergeCells(interpretationCell.number, 1, interpretationCell.number, 5);

  const patternsTitle = dashboardSheet.addRow(['Padrões Identificados']);
  patternsTitle.getCell(1).font = boldFont;
  dashboardSheet.mergeCells(patternsTitle.number, 1, patternsTitle.number, 5);
  const patternsList = Array.from(reportOutput.querySelectorAll('ul > li')).map(li => `• ${li.textContent}`).join('\n');
  const patternsCell = dashboardSheet.addRow([patternsList]);
  patternsCell.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  dashboardSheet.mergeCells(patternsCell.number, 1, patternsCell.number, 5);

  const suggestionsTitle = dashboardSheet.addRow(['Sugestões']);
  suggestionsTitle.getCell(1).font = boldFont;
  dashboardSheet.mergeCells(suggestionsTitle.number, 1, suggestionsTitle.number, 5);
  const suggestionsCell = dashboardSheet.addRow([reportOutput.querySelectorAll('p')[1]?.innerText || '']);
  suggestionsCell.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  dashboardSheet.mergeCells(suggestionsCell.number, 1, suggestionsCell.number, 5);

  const rawDataSheet = workbook.addWorksheet('Dados Brutos');
  const rawHeaders = ['ID', 'Serviço', 'Timestamp', 'Resposta (ms)', 'Status', 'Erro'];
  const rawHeaderRow = rawDataSheet.addRow(rawHeaders);
  rawHeaderRow.eachCell(cell => {
    cell.fill = headerFill;
    cell.font = whiteFont;
    cell.alignment = { horizontal: 'center' };
  });

  latestEvents.forEach(event => {
    const row = rawDataSheet.addRow([
      event.id,
      event.serviceName,
      event.timestamp,
      event.responseTime_ms,
      event.statusCode,
      event.error ? 'Sim' : 'Não'
    ]);
    if (event.error) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { color: { argb: 'FF9C0006' } };
      });
    }
  });

  rawDataSheet.columns = [
    { key: 'id', width: 10 },
    { key: 'serviceName', width: 20 },
    { key: 'timestamp', width: 25 },
    { key: 'responseTime_ms', width: 15 },
    { key: 'statusCode', width: 10 },
    { key: 'error', width: 10 },
  ];
  rawDataSheet.autoFilter = { from: 'A1', to: 'F1' };
  rawDataSheet.views = [{ state: 'frozen', ySplit: 1 }];

  const freqSheet = workbook.addWorksheet('Tabelas de Frequência');
  let currentRow = 1;
  Object.entries(latestFreqTables).forEach(([title, data]) => {
    if (title === 'Erros por Serviço') return;
    const headerRow = freqSheet.addRow([title]);
    headerRow.getCell(1).fill = headerFill;
    headerRow.getCell(1).font = whiteFont;
    freqSheet.mergeCells(currentRow, 1, currentRow, 5);
    currentRow++;

    const subHeaders = ['Classe/Categoria', 'Fi', 'Fri', 'Fri %', 'Acum %'];
    const subHeaderRow = freqSheet.addRow(subHeaders);
    subHeaderRow.eachCell(cell => { cell.font = boldFont; cell.fill = subHeaderFill; });
    currentRow++;

    data.forEach(dist => {
      freqSheet.addRow([
        dist.classOrCategory,
        dist.fi,
        dist.fri,
        parseFloat(dist.friPercent) / 100,
        parseFloat(dist.acumPercent) / 100
      ]);
      currentRow++;
    });
    freqSheet.getColumn(3).numFmt = '0.0000';
    freqSheet.getColumn(4).numFmt = '0.00%';
    freqSheet.getColumn(5).numFmt = '0.00%';

    freqSheet.addRow([]);
    currentRow++;
  });
  freqSheet.columns.forEach(col => { col.width = 20; });

  const chartDataSheet = workbook.addWorksheet('Dados para Gráficos');
  const instructionCell = chartDataSheet.addRow(['INSTRUÇÕES: Para criar um gráfico, selecione os dados de uma tabela (incluindo cabeçalhos), vá ao menu do Excel e clique em Inserir > Gráficos.']).getCell(1);
  instructionCell.font = { color: { argb: 'FF006100' }, bold: true };
  instructionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  chartDataSheet.mergeCells('A1:F1');
  chartDataSheet.getRow(1).height = 30;
  chartDataSheet.addRow([]);

  let chartDataRow = 3;

  chartDataSheet.getCell(chartDataRow, 1).value = 'Histograma: Tempo de Resposta';
  chartDataSheet.getCell(chartDataRow, 1).font = boldFont;
  chartDataRow++;
  chartDataSheet.getCell(chartDataRow, 1).value = 'Classe';
  chartDataSheet.getCell(chartDataRow, 2).value = 'Frequência';
  chartDataSheet.getRow(chartDataRow).font = boldFont;
  chartDataRow++;
  latestFreqTables['Tempos de Resposta (ms)'].forEach(d => {
    chartDataSheet.addRow([d.classOrCategory, d.fi]);
    chartDataRow++;
  });
  chartDataRow++;

  chartDataSheet.getCell(chartDataRow, 1).value = 'Distribuição de Erros por Serviço';
  chartDataSheet.getCell(chartDataRow, 1).font = boldFont;
  chartDataRow++;
  chartDataSheet.getCell(chartDataRow, 1).value = 'Serviço';
  chartDataSheet.getCell(chartDataRow, 2).value = 'Contagem de Erros';
  chartDataSheet.getRow(chartDataRow).font = boldFont;
  chartDataRow++;
  latestFreqTables['Erros por Serviço'].forEach(d => {
    chartDataSheet.addRow([d.classOrCategory, d.fi]);
    chartDataRow++;
  });
  chartDataRow++;

  chartDataSheet.getCell(chartDataRow, 1).value = 'Contagem por Código de Status';
  chartDataSheet.getCell(chartDataRow, 1).font = boldFont;
  chartDataRow++;
  chartDataSheet.getCell(chartDataRow, 1).value = 'Código';
  chartDataSheet.getCell(chartDataRow, 2).value = 'Contagem';
  chartDataSheet.getRow(chartDataRow).font = boldFont;
  chartDataRow++;
  latestFreqTables['Códigos de Status'].forEach(d => {
    chartDataSheet.addRow([d.classOrCategory, d.fi]);
    chartDataRow++;
  });

  chartDataSheet.columns.forEach(col => { col.width = 30; });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'DataCESUCA_Analise.xlsx';
  a.click();
  window.URL.revokeObjectURL(url);

  exportBtn.textContent = 'Exportar para Excel';
  exportBtn.disabled = false;
}


generateBtn.addEventListener('click', runAnalysis);
exportBtn.addEventListener('click', exportToExcel);

runAnalysis();