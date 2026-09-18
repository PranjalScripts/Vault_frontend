export type EncryptedField = {
  ciphertext: string;
  nonce: string;
  authTag: string;
};

export type Passcode = {
  _id: string;
  platform: string;
  username: string;
  password?: string;
  securityAnswer?: string;
  createdAt?: string;
  category?: string;
  website?: string;
  updatedAt?: string;
  srNo?: number;
};

export type RawPasscode = {
  _id: string;
  platform: string;
  username: string | EncryptedField;
  password?: string | EncryptedField;
  securityAnswer?: string | EncryptedField;
  createdAt?: string;
  category?: string;
  website?: string;
  updatedAt?: string;
  srNo?: number;
};

export type SortOption = "newest" | "oldest" | "az" | "za";
