export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CurrentUserResponse {
  user: User;
}
