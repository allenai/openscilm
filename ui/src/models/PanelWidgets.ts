import { ReportSection } from './Report';

export enum WidgetType {
  READER = 'READER',
  TABLE = 'TABLE',
  TABLE_RECOMMENDATIONS = 'TABLE_RECOMMENDATIONS',
  PAPER_FINDER = 'PAPER_FINDER',
  REPORT = 'REPORT',
}

export interface WidgetDataBase {
  type: WidgetType;
}

export interface ReportWidgetData extends WidgetDataBase {
  type: WidgetType.REPORT;
  id: string;
  sections: ReportSection[];
  // TODO: Add fields
}

export type WidgetData =
  | ReportWidgetData;

export enum WidgetEvent {
  WIDGET_OPEN = 'widget_open',
  WIDGET_CLOSE = 'widget_close',
}

export type WidgetId = string;
