import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Button, Snackbar, Tab } from '@mui/material';
import { Box } from '@mui/system';
import { lighten } from '@mui/material/styles';
import React, { useCallback, useEffect } from 'react';
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

  const [openShare, setOpenShare] = React.useState(false);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setOpenShare(true);
  }, []);
  const handleCloseShare = useCallback(() => setOpenShare(false), [setOpenShare]);

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        {/* Tabs commented out - feature turned off but kept for potential future use */}
        {/* <Box sx={{ display:'flex', justifyContent:'space-between', paddingLeft: '8px' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
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
                <Tab
                  label={label}
                  key={`Iteration${index}`}
                  value={`${index}`}
                />
              )
            })}
          </TabList>
          <Box sx={{ display: 'flex' }}>
          <Button onClick={handleShare} color="secondary">Share</Button>
        </Box>
        </Box> */}
            {sections.map((section, index) => (
              <TabPanel key={`Iteration${index}`} value={`${index}`} sx={{ padding:`0` }}>
                <Report section={section} previousSection={index > 0 ? sections[index - 1] : undefined} />
              </TabPanel>
            ))}
      </TabContext>

      <Snackbar
        open={openShare}
        autoHideDuration={1000}
        onClose={handleCloseShare}
        message="Link copied to clipboard"
      />

    </Box>
  );
};
