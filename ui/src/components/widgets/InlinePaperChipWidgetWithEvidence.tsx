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
  let paperTitleStr = paperTitle
  let sup = ''
  try{ 
    if (!paperTitleStr || paperTitleStr.length === 0) {
      paperTitleStr = 'no data'
    } else {
      if (paperTitleStr.includes('^^^')) {
        const index = paperTitleStr.lastIndexOf('^^^')
        sup = paperTitleStr.slice(index + 3)
        paperTitleStr = paperTitleStr.slice(0, index)
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
