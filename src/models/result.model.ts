export interface Result<T> {
  isSuccessful: boolean;
  Message?: string[];
  data?: T;
  statusCode: number;
}
