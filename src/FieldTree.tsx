import {
  InputSearch,
  LkFieldItem,
  LkFieldTree,
  SpaceVertical,
  TreeCollection,
} from "@looker/components";
import { keys } from "lodash";
import React, { memo, useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { DEFAULT_LABEL, LkField, useAppContext } from "./AppContext";

interface FieldTreeProps {
  fields: LkField;
  label: string;
}

const GroupTree = memo<{
  group_label: string;
  fields: LkField[string][string];
  hasSearch: boolean;
  type: "time_dimension" | "measure";
}>(({ group_label, fields, hasSearch, type }) => {
  const { updateField, time_dimension, measure } = useAppContext();
  if (group_label === DEFAULT_LABEL) {
    return (
      <>
        {keys(fields).map((fieldName) => (
          <LkFieldItem
            key={fieldName}
            onClick={() => updateField(type, fieldName)}
            selected={fieldName === time_dimension || fieldName === measure}
          >
            {fields[fieldName]}
          </LkFieldItem>
        ))}
      </>
    );
  }
  return (
    <LkFieldTree
      key={`${group_label}-${hasSearch}`}
      label={<strong>{group_label}</strong>}
      defaultOpen={hasSearch}
    >
      {keys(fields).map((fieldName) => (
        <LkFieldItem
          key={fieldName}
          onClick={() => updateField(type, fieldName)}
          selected={fieldName === time_dimension || fieldName === measure}
        >
          {fields[fieldName]}
        </LkFieldItem>
      ))}
    </LkFieldTree>
  );
});

const ViewTree = memo<{
  view_label: string;
  fields: LkField[string];
  hasSearch: boolean;
  type: "time_dimension" | "measure";
}>(({ view_label, fields, hasSearch, type }) => {
  return (
    <LkFieldTree
      key={`${view_label}-${hasSearch}`}
      label={<strong>{view_label}</strong>}
      defaultOpen={hasSearch}
    >
      {keys(fields).map((groupLabel) => (
        <GroupTree
          key={`${groupLabel}-${hasSearch}`}
          group_label={groupLabel}
          fields={fields[groupLabel]}
          hasSearch={hasSearch}
          type={type}
        />
      ))}
    </LkFieldTree>
  );
});

const FieldTreeCollection = memo<FieldTreeProps & { hasSearch: boolean }>(
  ({ fields, label, hasSearch }) => {
    return (
      <TreeCollection>
        {keys(fields).map((viewLabel) => (
          <ViewTree
            key={`${viewLabel}-${hasSearch}`}
            view_label={viewLabel}
            fields={fields[viewLabel]}
            hasSearch={hasSearch}
            type={label === "Measures" ? "measure" : "time_dimension"}
          />
        ))}
      </TreeCollection>
    );
  }
);

const FieldTree = memo<FieldTreeProps>(({ fields, label }) => {
  const [search, setSearch] = useState("");
  const [debounced_value, setDebouncedValue] = useDebounceValue(search, 250);
  const [filtered_fields, setFilteredFields] = useState<LkField>(fields);

  useEffect(() => {
    setDebouncedValue(search);
  }, [search, setDebouncedValue]);

  useEffect(() => {
    if (!debounced_value.trim()) {
      setFilteredFields(fields);
      return;
    }

    const searchTerm = debounced_value.toLowerCase().trim();
    const filtered: LkField = {};

    Object.entries(fields).forEach(([viewLabel, groups]) => {
      const filteredGroups: Record<string, Record<string, string>> = {};

      Object.entries(groups).forEach(([groupLabel, groupFields]) => {
        // Check if group label matches
        const groupMatches = groupLabel.toLowerCase().includes(searchTerm);

        const filteredGroupFields: Record<string, string> = {};

        Object.entries(groupFields).forEach(([fieldName, fieldLabel]) => {
          // Check if either the field name or label contains the search term
          if (
            groupMatches ||
            fieldName.toLowerCase().includes(searchTerm) ||
            fieldLabel.toLowerCase().includes(searchTerm)
          ) {
            filteredGroupFields[fieldName] = fieldLabel;
          }
        });

        if (Object.keys(filteredGroupFields).length > 0) {
          filteredGroups[groupLabel] = filteredGroupFields;
        }
      });

      if (Object.keys(filteredGroups).length > 0) {
        filtered[viewLabel] = filteredGroups;
      }
    });

    setFilteredFields(filtered);
  }, [debounced_value, fields]);

  const hasSearch = debounced_value.trim().length > 0;

  return (
    <SpaceVertical>
      <InputSearch
        lineHeight="xxsmall"
        placeholder={label}
        value={search}
        onChange={setSearch}
      />
      <FieldTreeCollection
        fields={filtered_fields}
        label={label}
        hasSearch={hasSearch}
      />
    </SpaceVertical>
  );
});

export default FieldTree;
