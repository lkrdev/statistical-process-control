import { Card } from "@looker/components";
import { getEmbedSDK } from "@looker/embed-sdk";
import React, { useCallback } from "react";
import styled from "styled-components";
import { useAppContext } from "./AppContext";
import useExtensionSdk from "./hooks/useExtensionSdk";

const StyledCard = styled(Card)`
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  & > iframe {
    width: 100%;
    height: 100%;
  }
`;

const Explore: React.FC = () => {
  const { setEmbedSdkConnection, initial_url } = useAppContext();
  const extension_sdk = useExtensionSdk();
  const dashboardRef = useCallback(
    (el: HTMLDivElement) => {
      console.log("Explore", initial_url);
      if (el && !el.children.length && initial_url) {
        const embed_sdk = getEmbedSDK();
        embed_sdk.init(extension_sdk.lookerHostData?.hostUrl!);
        embed_sdk
          .createExploreWithUrl(initial_url)
          .appendTo(el)
          .build()
          .connect()
          .then((embed) => {
            setEmbedSdkConnection(embed);
          })
          .catch((error: any) => {
            console.error("Error embedding dashboard:", error);
          });
      }
    },
    [initial_url]
  );

  return (
    <StyledCard p="xsmall" raised borderRadius="large" ref={dashboardRef} />
  );
};

export default Explore;
