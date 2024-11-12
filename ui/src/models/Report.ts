import { PaperDetailsType } from '../api/utils';
import { ReportWidgetData, WidgetType } from './PanelWidgets';

import { v4 as uuidV4 } from 'uuid';

export type UpdatedReportResponse = {
  reportId: string;
  eventId: string;
};

export type ReportCitationFromApi = {
  id: string;
  corpus_id?: number;
  corpusId?: number;
  snippets: string[];
  n_citations: number;
};

export type ReportCitation = {
  id: string;
  title: string;
  corpusId: number;
  snippets: string[];
  anchorText?: string;
  tag?: string;
  fullTitle?: string;
};

export interface ReportSection {
  id: string;
  title: string;
  tldr?: string;
  text: string;
  citations?: ReportCitation[];
  corpusId2Details?: { [corpusId: number]: PaperDetailsType };
}

// keep these models in sync with the nora-widget-service report.py models
export type ReportSectionFromApi = {
  id: string;
  title: string;
  tldr?: string;
  text: string;
  citations?: ReportCitationFromApi[];
};
export type ReportWidgetDataFromApi = {
  id: string;
  sections: ReportSectionFromApi[];
};
/// /// ///

export const reportSectionFactory = (
  apiSection: ReportSectionFromApi,
): ReportSection => {
  return {
    id: apiSection.id,
    title: apiSection.title,
    tldr: apiSection.tldr,
    text: apiSection.text,
    citations: apiSection.citations?.map(reportCitationFactory) ?? [],
  };
};

export const reportCitationFactory = (
  apiCitation: ReportCitationFromApi,
): ReportCitation => {
  return {
    id: apiCitation.id,
    title: 'Loading...',
    corpusId: apiCitation.corpus_id ?? apiCitation.corpusId ?? -1,
    snippets: apiCitation.snippets,
  };
};

export const reportWidgetFactory = ({
  id,
  sections,
}: {
  id?: string;
  sections?: ReportSectionFromApi[];
} = {}): ReportWidgetData => {
  return {
    id: id ?? uuidV4(),
    type: WidgetType.REPORT,
    sections: sections?.map(reportSectionFactory) ?? [],
  };
};

export function getReportWidgetDataFromApi(
  args: ReportWidgetDataFromApi,
): ReportWidgetData {
  return reportWidgetFactory(args);
}
