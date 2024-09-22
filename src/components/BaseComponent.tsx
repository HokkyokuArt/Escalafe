import { Box } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomBreadcrumb from './CustomBreadcrumb';
import SideBarMenu from './SidebarMenu';
import Topbar from './Topbar';

const BaseComponent = () => {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  return (
    <>
      <Topbar setSideMenuOpen={setSideMenuOpen} />
      <SideBarMenu setSideMenuOpen={setSideMenuOpen} sideMenuOpen={sideMenuOpen} />

      <Box sx={{
        transition: 'padding .2s ease-in-out',
        marginTop: '64px',
        padding: '20px',
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
