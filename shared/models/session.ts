export type SessionUser = {
  id: number;
  memberId: string;
  firstName: string;
  lastName: string;
  role: "admin" | "member";
};
