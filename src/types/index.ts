export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  budget_limit: number | null;
  created_at: string;
}

export interface Item {
  id: string;
  folder_id: string;
  user_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  total: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface FolderWithStats extends Folder {
  item_count: number;
  monthly_total: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface MonthlySpending {
  folder_id: string;
  folder_name: string;
  folder_icon: string;
  total: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  by_folder: { folder_name: string; total: number }[];
}

export interface MonthlyItemStats {
  current_total: number;
  previous_total: number;
  current_count: number;
  previous_count: number;
  average_item_total: number;
}

export interface ItemWithFolder extends Item {
  folder_name: string;
  folder_icon: string;
}

export interface CreateFolderData {
  name: string;
  icon: string;
  budget_limit: number | null;
}

export interface UpdateFolderData {
  name?: string;
  icon?: string;
  budget_limit?: number | null;
}

export interface CreateItemData {
  folder_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  date: string;
  note?: string;
}

export interface UpdateItemData {
  name?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  date?: string;
  note?: string | null;
}
