import * as React from 'react';
import { withStyles, WithStyles, createStyles, Theme } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import IconButton from '@material-ui/core/IconButton';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import CategoryIcon from '@material-ui/icons/Category';

import { Dataset } from '../model/dataset';
import { Place, PlaceGroup } from '../model/place';
import { WithLocale } from '../util/lang';
import { I18N } from '../config';
import ControlBarItem from './ControlBarItem';


const styles = (theme: Theme) => createStyles(
    {
        formControl: {
            marginRight: theme.spacing(2),
            marginBottom: theme.spacing(1),
            minWidth: 120,
        },
        button: {
            // margin: theme.spacing(0.1),
        },
        margin: {
            margin: theme.spacing(1),
        },
    });

interface PlaceSelectProps extends WithStyles<typeof styles>, WithLocale {
    datasets: Dataset[];
    userPlaceGroup: PlaceGroup;

    selectedPlaceGroupIds: string[] | null;
    selectedPlaceId: string | null;
    places: Place[];
    placeLabels: string[];
    selectPlace: (placeId: string | null, dataset: Dataset[], userPlaceGroup: PlaceGroup) => void;
    removeUserPlace: (placeId: string) => void;
    openDialog: (dialogId: string) => void;
}

class PlaceSelect extends React.Component<PlaceSelectProps> {

    handlePlaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.selectPlace(event.target.value || null, this.props.datasets, this.props.userPlaceGroup);
    };

    handleAddButtonClick = () => {
        const {openDialog} = this.props;
        openDialog('addUserPlaceFromText');
    };

    handleRemoveButtonClick = () => {
        const {removeUserPlace, selectedPlaceId} = this.props;
        if (selectedPlaceId !== null) {
            removeUserPlace(selectedPlaceId);
        }
    };

    render() {
        const {classes} = this.props;

        const places = this.props.places || [];
        const placeLabels = this.props.placeLabels || [];
        const selectedPlaceId = this.props.selectedPlaceId || '';
        const selectedPlaceGroupIds = this.props.selectedPlaceGroupIds || [];

        let placeSelectLabel;
        let placeSelect;
        let placeRemoveButton;
        if (places.length > 0) {
            placeSelectLabel = (
                <InputLabel
                    shrink
                    htmlFor="place-select"
                >
                    {I18N.get('Place')}
                </InputLabel>
            );

            placeSelect = (
                <Select
                    value={selectedPlaceId}
                    onChange={this.handlePlaceChange}
                    input={<Input name="place" id="place-select"/>}
                    displayEmpty
                    name="place"
                >
                    {places.map((place, i) => (
                        <MenuItem
                            key={place.id}
                            value={place.id}
                            selected={place.id === selectedPlaceId}
                        >
                            {placeLabels[i]}
                        </MenuItem>
                    ))}
                </Select>
            );

            const removeEnabled = selectedPlaceGroupIds.length === 1 && selectedPlaceGroupIds[0] === 'user'
                                  && selectedPlaceId !== '' && places.length > 0;
            placeRemoveButton = (
                <IconButton
                    key={'remove'}
                    className={classes.button}
                    disabled={!removeEnabled}
                    aria-label={I18N.get('Delete place')}
                    onClick={this.handleRemoveButtonClick}
                >
                    {<RemoveCircleOutlineIcon/>}
                </IconButton>
            );

        }

        const placeAddButton = (
            <IconButton
                key={'add'}
                className={classes.button}
                aria-label={I18N.get('Add place')}
                onClick={this.handleAddButtonClick}
            >
                {<CategoryIcon/>}
            </IconButton>
        );

        return (
            <ControlBarItem
                label={placeSelectLabel}
                control={placeSelect}
                actions={[placeAddButton, placeRemoveButton]}
            />
        );
    }
}

export default withStyles(styles)(PlaceSelect);

