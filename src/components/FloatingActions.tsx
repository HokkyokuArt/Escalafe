import { Icon, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import React from 'react';

export type Action = {
    id: string;
    icon: string;
    label: string;
    onClick: () => void;
};

export type FloatingActions = Action[];

type Props = {
    floatingActions: FloatingActions;
};

const FloatingActionsComponent = ({ floatingActions }: Props) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <SpeedDial
            ariaLabel="SpeedDial tooltip example"
            sx={{ position: 'absolute', bottom: 16, right: 16 }}
            icon={<SpeedDialIcon />}
            onClose={handleClose}
            onOpen={handleOpen}
            open={open}
        >
            {floatingActions.map((action) => (
                <SpeedDialAction
                    key={action.id}
                    icon={<Icon className={action.icon} />}
                    tooltipTitle={action.label}
                    tooltipOpen
                    onClick={() => {
                        action.onClick();
                        handleClose();
                    }}
                />
            ))}
        </SpeedDial>
    );
};

export default FloatingActionsComponent;
