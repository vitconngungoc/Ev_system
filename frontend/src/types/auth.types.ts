export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: {
    roleId?: number;
    roleName: string;
  };
  cccd?: string | null;
  gplx?: string | null;
  cccdPath1?: string | null;
  cccdPath2?: string | null;
  gplxPath1?: string | null;
  gplxPath2?: string | null;
  selfiePath?: string | null;
  rejectionReason?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  cancellationCount?: number;
  station?: {
    stationId: number;
    name: string;
  } | null;
}

export interface ResetPasswordData {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}
