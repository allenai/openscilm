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
}

export const InlinePaperChipWidgetWithEvidence: React.FC<
  InlinePaperChipWidgetWithEvidenceProps
> = (props) => {
  const { evidences, ...rest } = props;

  if (evidences.length === 0) {
    return <InlinePaperChipWidget {...rest} />;
  }
  return (
    <>
      <InlinePaperChipWidget {...rest} />
      <EvidenceCard evidences={evidences} />
    </>
  );
};
