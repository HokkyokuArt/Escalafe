import { Box } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomBreadcrumb from './CustomBreadcrumb';
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
        padding: '20px',
        paddingLeft: `calc(${(sideMenuOpen ? sideMenuWidth : 0)} + 20px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <CustomBreadcrumb />
        <Outlet />
      </Box>
    </>
  );
};

export default BaseComponent;
