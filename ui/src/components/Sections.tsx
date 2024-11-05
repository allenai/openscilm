import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Tab } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';
import { ReportSection } from 'src/models/Report';
import { Report } from './report/Report';


interface PropType {
  sections: ReportSection[];
}

export const Sections: React.FC<PropType> = (props) => {
  const { sections } = props
  const [value, setValue] = React.useState(`${sections.length - 1}`);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            {sections.map((_section, index) => (
              <Tab label={`Iteration${index}`} key={`Iteration${index}`} value={`${index}`} style={{ color: value !== `${index}` ? "#FAF2E9" : 'hotpink' }} />
            ))}
          </TabList>
        </Box>
            {sections.map((section, index) => (
              <TabPanel key={`Iteration${index}`} value={`${index}`}>
                <Report section={section} />
              </TabPanel>
            ))}
      </TabContext>
    </Box>
  );
};
