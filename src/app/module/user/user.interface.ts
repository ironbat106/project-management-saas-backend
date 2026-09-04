export interface IUpdateProfilePayload {
  name?: string;
}
 
export interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
