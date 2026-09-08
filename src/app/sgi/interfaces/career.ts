export interface Career {
  id: number;
  name: string;
  ucampus_id: number;
  ucampus_code?: string;
  demre_code?: string;
  uoh_code?: string;
  sap_code?: string;
  sies_code?: string;
  title?: string;
  title_type?: number;
  process_type_id: number;
  school_id: number;
  is_active: boolean;
  deleted_status?: boolean;
}
