export interface GenerationMethod {
  id: string;
  name: string;
  parameters: MethodParameter[];
}

export interface MethodParameter {
  name: string;
  label: string;
  type: 'number';
  required: boolean;
  description?: string;
}

export interface GenerationRequest {
  method: string;
  parameters: Record<string, number>;
}

export interface GenerationResponse {
  numbers: number[];
  statistics: {
    count: number;
    min: number;
    max: number;
    mean: number;
    period?: number;
    stopped_reason: string;
  };
}

export interface ValidationCondition {
  name: string;
  description: string;
  satisfied: boolean;
  details?: string;
}

export interface ValidationResponse {
  conditions: ValidationCondition[];
  all_satisfied: boolean;
  explanation?: string;
}

export interface StatisticalTestRequest {
  numbers: number[];
  test_type: 'chi_square' | 'kolmogorov_smirnov';
  parameters: Record<string, any>;
}

export interface StatisticalTestResponse {
  test_name: string;
  calculated_value: number;
  critical_value: number;
  passes: boolean;
  p_value?: number;
  details: string;
}

export interface RandomVariableRequest {
  count: number;
  method: 'acceptance_rejection';
  distribution: string;
}

export interface RandomVariableResponse {
  r1: number[];
  r2: number[];
  generated_values: number[];
  acceptance_rate: number;
  chart_data: {
    x: number[];
    y: number[];
    r2: number[];
    accepted: boolean[];
  };
}