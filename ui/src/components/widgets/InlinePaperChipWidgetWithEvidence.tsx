import React from 'react';

import {
  InlinePaperChipWidgetProps,
  InlinePaperChipWidget,
} from './InlinePaperChipWidget';
import { EvidenceCard } from './EvidenceCard';
import { Evidence } from './utils';
import { PaperDetailsType } from '../../api/utils';

interface InlinePaperChipWidgetWithEvidenceProps
  extends InlinePaperChipWidgetProps {
  evidences: Evidence[];
  fullTitle: string;
  id: string
  paperDetails?: PaperDetailsType
}

export const InlinePaperChipWidgetWithEvidence: React.FC<
  InlinePaperChipWidgetWithEvidenceProps
> = (props) => {
  const { evidences, id, paperTitle, paperDetails, ...rest } = props;
  const numStart = '0'.charCodeAt(0) 
  const numEnd= '9'.charCodeAt(0) 
  let paperTitleStr = paperTitle
  let sup = ''
  try{ 
    if (!paperTitleStr || paperTitleStr.length === 0) {
      paperTitleStr = 'no data'
    } else {
      const lastCode = (paperTitleStr.at(-1) as string).charCodeAt(0)
      if (!(lastCode >= numStart && lastCode <= numEnd)) {
        sup = paperTitleStr.at(-1) as string
        paperTitleStr = paperTitleStr.slice(0, -1)
      }
    }
  } catch (e) {
    console.error('parsing paper details error', e)
  }

  return (
    <>
      <EvidenceCard evidences={evidences} corpusId={props.corpusId} fullTitle={rest.fullTitle} id={id} paperDetails={paperDetails}>
        (<InlinePaperChipWidget id={id} {...rest} paperTitle={paperTitleStr}/>
        {sup && <sup>{sup}</sup>})
      </EvidenceCard>
    </>
  );
};
