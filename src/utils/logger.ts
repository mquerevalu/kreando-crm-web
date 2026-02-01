export class Logger {
  constructor(private context: string) {}

  info(message: string, data?: any) {
    console.log(`%c[${this.context}] ${message}`, 'color: #0066cc; font-weight: bold;', data);
  }

  warn(message: string, data?: any) {
    console.warn(`%c[${this.context}] ${message}`, 'color: #ff9900; font-weight: bold;', data);
  }

  error(message: string, data?: any) {
    console.error(`%c[${this.context}] ${message}`, 'color: #cc0000; font-weight: bold;', data);
  }
}
