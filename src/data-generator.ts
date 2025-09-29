export interface SystemEvent {
  id: number;
  timestamp: Date;
  serviceName: 'auth-service' | 'user-profile-service' | 'video-streaming-service' | 'alert-service';
  responseTime_ms: number;
  statusCode: 200 | 401 | 403 | 404 | 500;
  error: boolean;
}

const SERVICES: SystemEvent['serviceName'][] = [
  'auth-service',
  'user-profile-service',
  'video-streaming-service',
  'alert-service'
];

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const generateServiceEvent = (id: number, service: SystemEvent['serviceName']): SystemEvent => {
  const timestamp = new Date();
  let responseTime_ms: number;
  let statusCode: SystemEvent['statusCode'];

  switch (service) {
    case 'auth-service':
      responseTime_ms = random(50, 150);
      statusCode = Math.random() < 0.2 ? (Math.random() < 0.5 ? 401 : 403) : 200;
      break;
    case 'user-profile-service':
      responseTime_ms = random(150, 300);
      statusCode = Math.random() < 0.15 ? 500 : 200;
      break;
    case 'video-streaming-service':
      responseTime_ms = random(300, 1000);
      statusCode = Math.random() < 0.2 ? 500 : 200;
      break;
    case 'alert-service':
      responseTime_ms = Math.random() < 0.15 ? random(800, 2000) : random(80, 200);
      statusCode = responseTime_ms > 1000 ? 500 : 200;
      break;
  }

  return {
    id,
    timestamp,
    serviceName: service,
    responseTime_ms: Math.round(responseTime_ms),
    statusCode,
    error: statusCode !== 200
  };
};

export const generateSystemEvents = (count: number): SystemEvent[] => {
  const events: SystemEvent[] = [];
  for (let i = 0; i < count; i++) {
    const randomService = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    events.push(generateServiceEvent(i + 1, randomService));
  }
  return events;
};
