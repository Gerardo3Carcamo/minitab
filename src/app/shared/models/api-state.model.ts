export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiState<T> {
  status: RequestStatus;
  data: T | null;
  error: string | null;
}

export const createIdleState = <T>(): ApiState<T> => ({
  status: 'idle',
  data: null,
  error: null
});
