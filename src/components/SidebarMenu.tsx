import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import { Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { routesInfo } from '../routes';
import CustomIcon from './CustomIcon';

type Props = {
    sideMenuOpen: boolean;
    setSideMenuOpen: Dispatch<SetStateAction<boolean>>;
};

const sideMenuWidth = '240px';

const SideBarMenu = ({ setSideMenuOpen, sideMenuOpen }: Props) => {
    const navigate = useNavigate();

    return (
        <Box sx={{ display: 'flex' }}>
            <Drawer
                open={sideMenuOpen}
                sx={{
                    width: sideMenuWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: sideMenuWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {Object.values(routesInfo).map((info, index) => (
                            <ListItem key={index} disablePadding onClick={() => { navigate(info.path); setSideMenuOpen(false); }}>
                                <ListItemButton>
                                    <ListItemIcon>
                                        <CustomIcon icon={info.icon} />
                                    </ListItemIcon>
                                    <ListItemText primary={info.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </Box>
    );
};

export default SideBarMenu;
