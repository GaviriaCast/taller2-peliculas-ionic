export interface Movie {
  id: number;
  nombre: string;
  imagen: string;
  director?: string | null;
  anio?: number | null;
  genero?: string | null;
  sinopsis?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MoviesResponse {
  data: Movie[];
  meta: PaginationMeta;
}
