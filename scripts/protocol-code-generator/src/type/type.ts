export interface Type {
  get name(): string;
  get fixedSize(): number | null;
  get bounded(): boolean;
}
