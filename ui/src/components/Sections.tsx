import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Tab, Button, Modal } from '@mui/material';
import { Box } from '@mui/system';
import React, { useEffect } from 'react';
import { ReportSection } from 'src/models/Report';
import { Report } from './report/Report';


interface PropType {
  sections: ReportSection[];
  isRunning: boolean;
}

export const Sections: React.FC<PropType> = (props) => {
  const { sections, isRunning } = props
  const [value, setValue] = React.useState(`${sections.length - 1}`);
  useEffect(() => {
    setValue(`${sections.length - 1}`);
  }, [sections?.length])

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const [open, setOpen] = React.useState(false);
  const handleModalOpen = () => setOpen(true);
  const handleModalClose = () => setOpen(false);

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ display:'flex', justifyContent:'space-between', paddingLeft: '8px' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example" sx={{ justifyContent:'space-between' }}>
            {sections.map((_section, index) => {
              let label = 'Draft';
              if (!isRunning && index === sections.length - 1) {
                label = 'Answer'
              } else {
                label = `Draft ${index + 1}`
                if (
                  (isRunning && sections.length === 1) ||
                  (!isRunning && sections.length === 2)) {
                  label = 'Draft'
                }
              }
              return (
                <Tab label={label} key={`Iteration${index}`} value={`${index}`} style={{ color: value !== `${index}` ? "#FAF2E9" : '#0FCB8C' }} />
              )
            })}
          </TabList>
          <Button onClick={handleModalOpen}>Disclaimer</Button>
        </Box>
            {sections.map((section, index) => (
              <TabPanel key={`Iteration${index}`} value={`${index}`} sx={{ padding:`0` }}>
                <Report section={section} previousSection={index > 0 ? sections[index - 1] : undefined} />
              </TabPanel>
            ))}
      </TabContext>

      <Modal open={open} onClose={handleModalClose}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: {xs: '90vw', sm: '60vw'}, bgcolor: 'background.paper', boxShadow: 24, padding: {xs: '4px 16px', sm: '16px 32px'} }}>
          <h3>Disclaimer</h3>
          <p>
            OpenScholar-8B answers questions by retrieving open-access papers from the scientific literature. It is not designed to answer non-scientific questions or questions that require sources outside the scientific literature.
          </p>
          <p>
            Its output may have errors, and these errors might be difficult to detect. For example, there might be serious factual inaccuracies or omissions. Please verify the accuracy of the generated text whenever possible.
          </p>
        </Box>
      </Modal>

    </Box>
  );
};
