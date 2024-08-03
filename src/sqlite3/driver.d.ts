import {
  ExecOptions,
  SqlValue
} from "@sqlite.org/sqlite-wasm";

declare type ExecResultRow<T> = {
  record: T,
}

declare type ExecParams<T> = {
  sql: string,
  bind?: Object[],
  callback?: (row: ExecResultRow<T>) => void,
}



declare class SqliteDriver {
  initialize(sqlite_db_file: string);

  get_db_file(): string;
  export_data(): Promise<Blob>;
  get_config(): Promise<any>;

  open(): Promise<void>;
  exec<T>(params: ExecParams<T>): Promise<any>;
  close(): Promise<any>;
}

