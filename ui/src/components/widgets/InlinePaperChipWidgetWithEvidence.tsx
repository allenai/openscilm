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
  id: string
}

export const InlinePaperChipWidgetWithEvidence: React.FC<
  InlinePaperChipWidgetWithEvidenceProps
> = (props) => {
  const { evidences, id, ...rest } = props;

  return (
    <>
      <EvidenceCard evidences={evidences} corpusId={props.corpusId} fullTitle={rest.fullTitle} id={id}>
        <InlinePaperChipWidget id={id} {...rest} />
      </EvidenceCard>
    </>
  );
};
