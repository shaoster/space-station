import styled from "@emotion/styled";
import { Autocomplete, Badge, BadgeProps, Box, TextField } from "@mui/material";
import { ImageId } from "../glossary/Images";
import { useDataManager, useGameConfiguration } from "./Util";

const IdLabel = styled(Badge)<BadgeProps>(() => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    border: `2px solid`,
    padding: '0 4px',
    textAlign: 'right',
  },
}));

export const ImageSelector = (
  { label, categories }:
  {label: string, categories?: string[]}
) => {
  const {
    gameConfiguration: {
      imageLibrary
    }
  } = useGameConfiguration();
  const {
    data: maybeImageId,
    updateData: updateImageId
  } = useDataManager<ImageId>();
  // TODO: Support reactive srcSet
  const options = Object.keys(imageLibrary);
  const handleChange = (_evt: any, imageId: ImageId | null) => {
    updateImageId(imageId ?? undefined)
  };
  return <Autocomplete
    renderOption={(props: any, selectedId: ImageId) => (
      <Box key={selectedId} component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
        <IdLabel badgeContent={selectedId} color="primary" anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}>
          <img src={imageLibrary[selectedId].url} height={256} width={256} />
        </IdLabel>
      </Box>
    )}
    renderInput={(params => (
      <TextField
        {...params}
        label={label}
      />
    ))}
    onChange={handleChange}
    options={options}
    value={maybeImageId ?? null}
  />
}