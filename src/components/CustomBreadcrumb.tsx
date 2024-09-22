import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import { useLocation } from 'react-router-dom';
import { routesInfo, RoutesName } from '../routes';
import CustomIcon from './CustomIcon';

function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    event.preventDefault();
}

const CustomBreadcrumb = () => {
    const location = useLocation();
    const info = routesInfo[location.pathname as RoutesName];

    if (info) {
        return (
            <div role="presentation" onClick={handleClick}>
                <Breadcrumbs aria-label="breadcrumb">

                    <Typography
                        sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}
                    >
                        <CustomIcon
                            fontSize='13px'
                            icon={info.icon}
                        />
                        {info.label}
                    </Typography>
                </Breadcrumbs>
            </div >
        );
    } else {
        return <></>;
    }
};

export default CustomBreadcrumb;
