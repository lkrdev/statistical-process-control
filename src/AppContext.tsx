import { SelectOptionGroupProps, SelectOptionObject } from "@looker/components";
import { ILookerConnection } from "@looker/embed-sdk";
import {
  ILookmlModelExplore,
  ILookmlModelExploreField,
  IUser,
} from "@looker/sdk";
import { get, orderBy, reduce, set } from "lodash";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import useSWR from "swr";
import useSdk from "./hooks/useSdk";
import useSearchParams from "./hooks/useSearchParams";

export const DEFAULT_LABEL = "_unknown";
type FieldLabel = string;

export type LkField = {
  [view_label: string]: {
    [field_group_label: string]: {
      [field: string]: FieldLabel;
    };
  };
};

interface AppContextType {
  isLoading: boolean;
  me: IUser | undefined;
  lookml_model_explore: ILookmlModelExplore | undefined;
  embedSdkConnection: ILookerConnection | undefined;
  setEmbedSdkConnection: React.Dispatch<
    React.SetStateAction<ILookerConnection | undefined>
  >;
  grouped_model_options: SelectOptionGroupProps[];
  model?: string;
  explore?: string;
  explore_fields:
    | {
        time_like: LkField;
        measure: LkField;
        sorted_time_like: LkField;
        sorted_measure: LkField;
      }
    | undefined;
  updateField: (
    type: "time_dimension" | "measure",
    value: string | undefined
  ) => void;
  time_dimension: string | undefined;
  measure: string | undefined;
  handleSPC: (props: {
    time_dimension: string;
    measure: string;
    explore: string;
    model: string;
    limit?: number;
  }) => void;
  initial_url: string | undefined;
  clearFields: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const sdk = useSdk();
  const [embedSdkConnection, setEmbedSdkConnection] =
    useState<ILookerConnection>();
  const location = useLocation();
  const { search_params, updateSearchParams } = useSearchParams();
  const [time_dimension, setTimeDimension] = useState<string | undefined>(
    get(search_params, ["time_dimension"], undefined)
  );
  const [measure, setMeasure] = useState<string | undefined>(
    get(search_params, ["measure"], undefined)
  );
  const [initial_url, setInitialUrl] = useState<string | undefined>();

  const handleSPC = async ({
    time_dimension,
    measure,
    explore,
    model,
    limit = 5000,
  }: {
    time_dimension: string;
    measure: string;
    explore: string;
    model: string;
    limit?: number;
  }) => {
    let url = `/explore/${model}/${explore}?fields=${time_dimension},${measure}&limit=${limit}&toggle=dat,vis`;
    const dynamic_fields = createDynamicFields(measure);
    url += `&dynamic_fields=${encodeURIComponent(
      JSON.stringify(dynamic_fields)
    )}`;
    const vis = createVis();
    url += `&vis=${encodeURIComponent(JSON.stringify(vis))}`;
    setInitialUrl(url);
    if (embedSdkConnection) {
      // TODO: Use options when available in the embed-sdk
      // @ts-ignore
      await embedSdkConnection.preload(false, { waitUntilLoaded: true });
      embedSdkConnection.loadUrl({ url: ["/embed", url].join("") });
    }
  };

  const clearFields = () => {
    setTimeDimension(undefined);
    setMeasure(undefined);
    updateSearchParams({
      time_dimension: undefined,
      measure: undefined,
    });
  };

  const updateField = (
    type: "time_dimension" | "measure",
    value: string | undefined
  ) => {
    if (type === "time_dimension") {
      setTimeDimension(value);
    } else {
      setMeasure(value);
    }
    updateSearchParams({
      [type]: value,
    });
  };

  const [model, explore] = useMemo(() => {
    const [, model, explore, ...rest] = location.pathname
      .split("/")
      .filter(Boolean);
    return [model, explore];
  }, [location.pathname]);
  const lookml_model_explore = useSWR(
    model?.length && explore?.length ? `${model}::${explore}` : null,
    () =>
      sdk.ok(
        sdk.lookml_model_explore({
          lookml_model_name: model,
          explore_name: explore,
        })
      )
  );

  const { data: me, isLoading, error } = useSWR("me", () => sdk.ok(sdk.me()));

  const lookml_models = useSWR("lookml_models", () =>
    sdk.ok(
      sdk.all_lookml_models({
        include_internal: true,
        exclude_empty: true,
        exclude_hidden: true,
      })
    )
  );

  const grouped_model_options: SelectOptionGroupProps[] = useMemo(() => {
    return reduce(
      orderBy(lookml_models.data, (model) =>
        (model.label ?? model.name ?? "").toLocaleLowerCase()
      ),
      (acc, model) => {
        const explore_options: SelectOptionObject[] = reduce(
          model.explores,
          (exp_acc, exp) => {
            if (exp.name) {
              exp_acc.push({
                label: exp.label ?? exp.name ?? "",
                value: `${model.name}::${exp.name}`,
                description: exp.description ?? "",
              });
            }
            return exp_acc;
          },
          [] as SelectOptionObject[]
        );

        if (explore_options.length) {
          acc.push({
            label: model.label ?? model.name ?? "",
            options: orderBy(explore_options, (option) =>
              (option.label ?? option.value).toLocaleLowerCase()
            ),
          });
        }
        return acc;
      },
      [] as SelectOptionGroupProps[]
    );
  }, [lookml_models.data]);

  const explore_fields = useMemo(() => {
    const fields = get(lookml_model_explore.data, ["fields"], {});
    const measures = get(fields, ["measures"], []);
    const dimensions = get(fields, ["dimensions"], []);

    const time_like = reduce(
      dimensions,
      (acc, dimension: ILookmlModelExploreField) => {
        if (dimension.hidden) {
          return acc;
        }
        if (dimension.is_timeframe) {
          set(
            acc,
            [
              dimension.view_label ?? DEFAULT_LABEL,
              dimension.field_group_label ?? DEFAULT_LABEL,
              dimension.name ?? DEFAULT_LABEL,
            ],
            dimension.field_group_variant ??
              dimension.label_short ??
              dimension.label ??
              dimension.name ??
              DEFAULT_LABEL
          );
        }
        return acc;
      },
      {} as LkField
    );

    // Create measure object
    const measure = reduce(
      measures,
      (acc, measure: ILookmlModelExploreField) => {
        if (measure.hidden) {
          return acc;
        }
        if (measure.name?.startsWith("turtle::")) {
          return acc;
        }
        set(
          acc,
          [
            measure.view_label ?? DEFAULT_LABEL,
            measure.field_group_label ?? DEFAULT_LABEL,
            measure.name ?? DEFAULT_LABEL,
          ],
          measure.field_group_variant ??
            measure.label_short ??
            measure.label ??
            measure.name ??
            DEFAULT_LABEL
        );
        return acc;
      },
      {} as LkField
    );

    // Create sorted version of time_like
    const sorted_time_like = Object.keys(time_like)
      .sort()
      .reduce((acc, view_label) => {
        acc[view_label] = Object.keys(time_like[view_label])
          .sort()
          .reduce((group_acc, field_group_label) => {
            group_acc[field_group_label] = Object.keys(
              time_like[view_label][field_group_label]
            )
              .sort()
              .reduce((field_acc, field) => {
                field_acc[field] =
                  time_like[view_label][field_group_label][field];
                return field_acc;
              }, {} as { [field: string]: FieldLabel });
            return group_acc;
          }, {} as { [field_group_label: string]: { [field: string]: FieldLabel } });
        return acc;
      }, {} as LkField);

    // Create sorted version of measure
    const sorted_measure = Object.keys(measure)
      .sort()
      .reduce((acc, view_label) => {
        acc[view_label] = Object.keys(measure[view_label])
          .sort()
          .reduce((group_acc, field_group_label) => {
            group_acc[field_group_label] = Object.keys(
              measure[view_label][field_group_label]
            )
              .sort()
              .reduce((field_acc, field) => {
                field_acc[field] =
                  measure[view_label][field_group_label][field];
                return field_acc;
              }, {} as { [field: string]: FieldLabel });
            return group_acc;
          }, {} as { [field_group_label: string]: { [field: string]: FieldLabel } });
        return acc;
      }, {} as LkField);

    return {
      time_like,
      sorted_time_like,
      measure,
      sorted_measure,
    };
  }, [lookml_model_explore.data]);

  useEffect(() => {
    if (
      model?.length &&
      explore?.length &&
      time_dimension?.length &&
      measure?.length
    ) {
      handleSPC({ time_dimension, measure, explore, model });
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        me,
        isLoading,
        lookml_model_explore: lookml_model_explore.data,
        embedSdkConnection,
        setEmbedSdkConnection,
        grouped_model_options,
        explore_fields: lookml_model_explore.data ? explore_fields : undefined,
        model,
        explore,
        updateField,
        time_dimension,
        measure,
        handleSPC,
        initial_url,
        clearFields,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const createDynamicFields = (measure_name: string) => {
  const measure = ["${", measure_name, "}"].join("");
  return [
    {
      category: "table_calculation",
      expression: `mean(${measure})`,
      label: "Mean",
      value_format: null,
      value_format_name: "decimal_2",
      _kind_hint: "measure",
      table_calculation: "mean",
      _type_hint: "number",
    },
    {
      category: "table_calculation",
      expression: `stddev_samp(${measure})`,
      label: "Standard Deviation",
      value_format: null,
      value_format_name: "decimal_2",
      _kind_hint: "measure",
      table_calculation: "standard_deviation",
      _type_hint: "number",
    },
    {
      category: "table_calculation",
      expression: "${mean}+3*${standard_deviation}",
      label: "UCL",
      value_format: null,
      value_format_name: "decimal_1",
      _kind_hint: "measure",
      table_calculation: "ucl",
      _type_hint: "number",
    },
    {
      category: "table_calculation",
      expression: "${mean}-3*${standard_deviation}",
      label: "LCL",
      value_format: null,
      value_format_name: "decimal_1",
      _kind_hint: "measure",
      table_calculation: "lcl",
      _type_hint: "number",
    },
    {
      category: "table_calculation",
      expression: "${mean}+2*${standard_deviation}",
      label: "UCW",
      value_format: null,
      value_format_name: "decimal_1",
      _kind_hint: "measure",
      table_calculation: "ucw",
      _type_hint: "number",
    },
    {
      category: "table_calculation",
      expression: "${mean}-2*${standard_deviation}",
      label: "LCW",
      value_format: null,
      value_format_name: "decimal_1",
      _kind_hint: "measure",
      table_calculation: "lcw",
      _type_hint: "number",
    },
    {
      category: "table_calculation",
      expression: ["if(", measure, ">${ucl},1,0)"].join(""),
      label: "Above UCL",
      value_format: null,
      value_format_name: null,
      _kind_hint: "measure",
      table_calculation: "above_ucl",
      _type_hint: "number",
    },
    {
      category: "table_calculation",
      expression: ["if(", measure, "<${lcl},1,0)"].join(""),
      label: "Below LCL",
      value_format: null,
      value_format_name: null,
      _kind_hint: "measure",
      table_calculation: "below_lcl",
      _type_hint: "number",
    },
  ];
};

const createVis = () => {
  return {
    x_axis_gridlines: false,
    y_axis_gridlines: true,
    show_view_names: false,
    show_y_axis_labels: true,
    show_y_axis_ticks: true,
    y_axis_tick_density: "default",
    y_axis_tick_density_custom: 5,
    show_x_axis_label: true,
    show_x_axis_ticks: true,
    y_axis_scale_mode: "linear",
    x_axis_reversed: false,
    y_axis_reversed: false,
    plot_size_by_field: false,
    trellis: "",
    stacking: "",
    limit_displayed_rows: false,
    legend_position: "center",
    point_style: "none",
    show_value_labels: false,
    label_density: 25,
    x_axis_scale: "auto",
    y_axis_combined: true,
    show_null_points: true,
    interpolation: "linear",
    hidden_fields: ["standard_deviation"],
    type: "looker_line",
    defaults_version: 1,
    hidden_series: ["above_ucl", "below_lcl"],
  };
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
