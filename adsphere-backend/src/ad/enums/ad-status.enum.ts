export enum AdStatus {
  PENDING = "pending",        // așteaptă aprobare (default)
  APPROVED = "approved",      // publicat și vizibil
  REJECTED = "rejected",      // respins de moderator sau de AI
  ARCHIVED = "archived",      // ascuns, de ex. după expirare
  DELETED = "deleted",        // șters de utilizator
}
