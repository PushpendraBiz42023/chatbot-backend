import { UserRole } from "./user.entity";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: UserRole;
}
