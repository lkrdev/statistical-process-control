import { ButtonOutline, Span } from "@looker/components";
import React from "react";
import { useAppContext } from "./AppContext";

const SPCButton: React.FC = () => {
  const { time_dimension, measure, model, explore, handleSPC } =
    useAppContext();

  const doSPC = () => {
    if (
      time_dimension?.length &&
      measure?.length &&
      model?.length &&
      explore?.length
    ) {
      handleSPC({ time_dimension, measure, explore, model });
    }
  };

  return (
    <>
      {!time_dimension && (
        <Span fontSize="xxsmall">Select a time dimension</Span>
      )}
      {!measure && <Span fontSize="xxsmall">Select a measure</Span>}
      <ButtonOutline disabled={!time_dimension || !measure} onClick={doSPC}>
        SPC It!
      </ButtonOutline>
    </>
  );
};

export default SPCButton;
