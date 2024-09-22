import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import React, { Dispatch, ReactElement, SetStateAction } from 'react';

export type DialogProps = {
    state: [
        open: boolean,
        setState: Dispatch<SetStateAction<boolean>>,
    ],
    onClose: () => void;
    content: {
        header: string;
        body: ReactElement;
        footer?: ReactElement;
    };
};

const CustomDialog = ({ state, content, onClose }: DialogProps) => {

    const [localState, setState] = state;

    const handleClose = () => {
        onClose();
        setState(false);
    };

    return (
        <Dialog
            fullWidth
            maxWidth={'md'}
            open={localState}
            TransitionComponent={Transition}
            onClose={handleClose}
        >
            <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>

            <DialogTitle>{content.header}</DialogTitle>
            <DialogContent>
                <Box sx={{ paddingTop: '10px' }}>
                    {content.body}
                </Box>
            </DialogContent>
            <DialogActions>
                {content.footer}
            </DialogActions>
        </Dialog>
    );
};

export default CustomDialog;

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});
