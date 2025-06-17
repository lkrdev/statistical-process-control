import {
  Box,
  Card,
  Divider,
  Header,
  InputSearch,
  Label,
  SpaceVertical,
  Span,
} from "@looker/components";
import React from "react";
import { useHistory } from "react-router-dom";
import Balancer from "react-wrap-balancer";
import { useAppContext } from "./AppContext";
import FieldTree from "./FieldTree";
import SPCButton from "./SPCButton";

const Sidebar: React.FC = () => {
  const { grouped_model_options, explore_fields, lookml_model_explore } =
    useAppContext();
  const history = useHistory();

  return (
    <Card
      raised
      position="relative"
      backgroundColor="#B7C9E2"
      p="xsmall"
      borderRadius="large"
    >
      <Box display="flex" flexDirection="column" height="100%">
        <Header>
          <Span p="xsmall" fontSize="xlarge">
            <Balancer>Statistical Process Control</Balancer>
          </Span>
        </Header>
        <SpaceVertical>
          <Label fontSize="small">Explore</Label>
          <InputSearch
            key={lookml_model_explore?.name || "no-explore"}
            placeholder={
              lookml_model_explore?.label ??
              lookml_model_explore?.name ??
              "Select an Explore"
            }
            options={grouped_model_options}
            openOnFocus={true}
            clearOnClose={true}
            onSelectOption={(option) => {
              if (option) {
                history.push(
                  `/explore/${option.value.split("::")[0]}/${
                    option.value.split("::")[1]
                  }`
                );
              }
            }}
          />
        </SpaceVertical>
        {explore_fields && (
          <Box flexGrow={1} overflow="auto">
            <SpaceVertical pt="xsmall">
              <Divider />
              <Label fontSize="small">Select Fields</Label>
              <FieldTree
                fields={explore_fields.sorted_time_like}
                label="Time Dimensions"
              />
              <FieldTree
                fields={explore_fields.sorted_measure}
                label="Measures"
              />
            </SpaceVertical>
          </Box>
        )}
        <SPCButton />
      </Box>
    </Card>
  );
};

export default Sidebar;
