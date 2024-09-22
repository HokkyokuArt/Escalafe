import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import { useNavigate } from 'react-router-dom';
import { routes } from '../routes';
import CustomIcon from './CustomIcon';

enum MenuListIcons {
    'home' = 'fa-solid fa-house',
    'pessoas' = 'fa-solid fa-user-tie',
    'funcoes' = 'fa-solid fa-gears',
}

type MenuListIconsKey = keyof typeof MenuListIcons;

type Props = {
    sideMenuWidth: string;
    sideMenuOpen: boolean;
};

const SideBarMenu = ({ sideMenuWidth, sideMenuOpen }: Props) => {
    const navigate = useNavigate();

    const routesInfo = routes.routes
        .filter(s => s.path === '/')[0]
        .children?.filter(s => s.path)
        .map(s => ({ path: s.path!, label: s.id })) ?? [];

    const getIconOption = (path: string) => {
        return MenuListIcons[path as MenuListIconsKey];
    };

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
                        {routesInfo.map((info, index) => (
                            <ListItem key={index} disablePadding onClick={() => { navigate(info.path); }}>
                                <ListItemButton>
                                    <ListItemIcon>
                                        <CustomIcon icon={getIconOption(info.path)} />
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
