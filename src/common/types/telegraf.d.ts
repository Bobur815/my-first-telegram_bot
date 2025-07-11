import 'telegraf';

declare module 'telegraf' {
  interface Context {
    session: Record<string, any>;
  }
}
