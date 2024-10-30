import React from 'react';

import {
  InlinePaperChipWidgetProps,
  InlinePaperChipWidget,
} from './InlinePaperChipWidget';
import { EvidenceCard } from './EvidenceCard';
import { Evidence } from './utils';

interface InlinePaperChipWidgetWithEvidenceProps
  extends InlinePaperChipWidgetProps {
  evidences: Evidence[];
  fullTitle: string;
}

export const InlinePaperChipWidgetWithEvidence: React.FC<
  InlinePaperChipWidgetWithEvidenceProps
> = (props) => {
  const { evidences, ...rest } = props;

  return (
    <>
      <EvidenceCard evidences={evidences} corpusId={props.corpusId} fullTitle={rest.fullTitle}>
        <InlinePaperChipWidget {...rest} />
      </EvidenceCard>
    </>
  );
};
