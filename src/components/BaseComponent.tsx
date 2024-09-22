import { Box } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideBarMenu from './SidebarMenu';
import Topbar from './Topbar';

const sideMenuWidth = '240px';

const BaseComponent = () => {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  return (
    <>
      <Topbar setSideMenuOpen={setSideMenuOpen} />
      <SideBarMenu sideMenuWidth={sideMenuWidth} sideMenuOpen={sideMenuOpen} />

      <Box sx={{
        transition: 'padding .2s ease-in-out',
        marginTop: '64px',
        paddingLeft: sideMenuOpen ? sideMenuWidth : 0,
      }}>
        <Outlet />
      </Box>
    </>
  );
};

export default BaseComponent;
