const google = window.google;
import { differenceInMonths } from "date-fns";
import Main from "./components/layout/main";
import { useEffect, useState } from "react";
import jwt_decode from "jwt-decode";
import Cookies from "js-cookie";
import GoogleLogin from "./components/layout/google-login";
import AppLogin from "./components/layout/app-login copy";
import { useDataContext } from "./context/data";
import LoadingAnimation from "./components/animation/loading";

import CarAnimation from "./components/animation/car";
import BundleBackground from "./components/svg/bundle-background";
import MainFilter from "./components/layout/main-filter";

import {
  isNotOlderThanTwoMonthsFilter,
  isBetweenTwoToSixMonthsOldFilter,
  isBetweenSixToTwelveMonthsOldFilter,
  isBetweenOneToTwoYearsOldFilter,
  isOlderThanTwoYearsFilter,
} from "./functions/date";
import MainAll from "./components/layout/main-all";

function App() {
  const [useToken, setToken] = useState(Cookies.get("token"));
  const [tokenClient, setTokenClient] = useState({});
  const {
    emails,
    getEmailData,
    setDataMessages,
    dataMessages,
    setCountedSenders,
    valueFilter,
    setCountedDate,
    countedDate,
    deleteMessagesId,
    setDeleteMessagesId,
    valueDate,
    setValueAll,
  } = useDataContext();

  useEffect(() => {
    Cookies.remove("token");
    Cookies.remove("keyFetch");
  }, []);

  const client_id = import.meta.env.VITE_CLIENT_ID;
  const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

  const handleCallbackResponse = (response) => {
    Cookies.set("token", response.credential);
    setToken(Cookies.get("token"));
  };

  const creatData = () => {
    tokenClient.requestAccessToken();
  };

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: client_id,
      callback: handleCallbackResponse,
    });
    google.accounts.id.renderButton(document.getElementById("signInDiv"), {
      theme: "outline",
      size: "large",
    });

    setTokenClient(
      google.accounts.oauth2.initTokenClient({
        client_id: client_id,
        apiKey: import.meta.env.VITE_API_KEY,
        scope: SCOPES,
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            Cookies.set("keyFetch", tokenResponse.access_token);
            getEmailData();
          }
        },
      })
    );
  }, [useToken]);

  useEffect(() => {
    const senderRegex = /(.*) <(.*)>/gm;
    let newJson = emails.map((d) => ({
      id: d.id,
      snippet: d.snippet,
      sizeInMegabytes: +parseFloat(d.sizeEstimate / 1024 / 1024).toFixed(2),
      sizeInGramsOfCo2:
        parseFloat(d.sizeEstimate / 1024 / 1024).toFixed(2) * 20,
      labelIds: d.labelIds,
      from: [
        ...d.payload.headers
          .find((element) => element.name === "From")
          .value.matchAll(senderRegex),
      ],
      date: new Date(
        d.payload.headers.find((element) => element.name === "Date").value
      ),
    }));
    const jsonOutput = {
      children: newJson,
    };

    setDataMessages(jsonOutput);
  }, [emails]);

  const countOcurrancesOfSenders = () => {
    if (dataMessages && dataMessages.children) {
      let from = [];
      for (const message of dataMessages.children) {
        if (typeof message.from !== undefined && message.from[0]) {
          const currentItem = message.from[0][1];
          const indexOfSearchItem = from.findIndex(
            (item) => item.name === currentItem
          );
          if (indexOfSearchItem > -1) {
            from[indexOfSearchItem].value += 1;
          } else {
            from.push({ name: currentItem, value: 1 });
          }
        }
      }
      setCountedSenders(from);
    }
  };

  useEffect(() => {
    if (
      dataMessages &&
      dataMessages.children &&
      dataMessages.children.length > 0
    ) {
      countOcurrancesOfSenders();
    }
  }, [dataMessages]);

  useEffect(() => {
    if (
      valueFilter &&
      dataMessages &&
      dataMessages.children &&
      dataMessages.children.length > 0
    ) {
      // filter data
      const filterData = dataMessages.children.filter((item) => {
        if (typeof item.from !== undefined && item.from[0]) {
          return item.from[0][1] === valueFilter;
        }
      });

      console.log(filterData);

      const newArray = [];

      filterData.forEach((item) => {
        newArray.push(item.id);
      });

      setDeleteMessagesId(newArray);

      const isNotOlderThanTwoMonths = filterData.filter((mail) =>
        isNotOlderThanTwoMonthsFilter(mail.date)
      );
      const isBetweenTwoToSixMonthsOld = filterData.filter((mail) =>
        isBetweenTwoToSixMonthsOldFilter(mail.date)
      );
      const isBetweenSixToTwelveMonthsOld = filterData.filter((mail) =>
        isBetweenSixToTwelveMonthsOldFilter(mail.date)
      );
      const isBetweenOneToTwoYearsOld = filterData.filter((mail) =>
        isBetweenOneToTwoYearsOldFilter(mail.date)
      );
      const isOlderThanTwoYears = filterData.filter((mail) =>
        isOlderThanTwoYearsFilter(mail.date)
      );

      const objectDateCount = [
        {
          name: "Niet ouder als 2 maanden",
          value: isNotOlderThanTwoMonths.length,
          function: "isNotOlderThanTwoMonthsFilter",
        },
        {
          name: "Tussen 2 en 6 maanden",
          value: isBetweenTwoToSixMonthsOld.length,
          function: "isBetweenTwoToSixMonthsOldFilter",
        },
        {
          name: "Tussen 6 en 12 maanden",
          value: isBetweenSixToTwelveMonthsOld.length,
          function: "isBetweenSixToTwelveMonthsOldFilter",
        },
        {
          name: "Tussen 1 en 2 jaar",
          value: isBetweenOneToTwoYearsOld.length,
          function: "isBetweenOneToTwoYearsOldFilter",
        },
        {
          name: "Ouder dan 2 jaar",
          value: isOlderThanTwoYears.length,
          function: "isOlderThanTwoYearsFilter",
        },
      ];

      const objectDateCountFilter = objectDateCount.filter(
        (item) => item.value !== 0
      );

      const json = { children: objectDateCountFilter };
      setCountedDate(json);
    }
  }, [valueFilter, dataMessages, valueDate]);

  const getId = (data) => {
    const newArray = [];
    data.forEach((item) => {
      newArray.push(item.id);
    });
    setDeleteMessagesId(newArray);
    console.log(newArray);
  };

  const generateJson = (data) => {
    const json = { children: data };
    console.log(json);
    setValueAll(json);
  };

  useEffect(() => {
    if (
      valueFilter &&
      dataMessages &&
      dataMessages.children &&
      dataMessages.children.length > 0 &&
      valueDate !== undefined
    ) {
      const filterData = dataMessages.children.filter((item) => {
        if (typeof item.from !== undefined && item.from[0]) {
          return item.from[0][1] === valueFilter;
        }
      });

      if (valueDate === "isNotOlderThanTwoMonthsFilter") {
        const filterDateToAllMails = filterData.filter((mail) =>
          isNotOlderThanTwoMonthsFilter(mail.date)
        );
        generateJson(filterDateToAllMails);
        getId(filterDateToAllMails);
      }
      if (valueDate === "isBetweenTwoToSixMonthsOldFilter") {
        const filterDateToAllMails = filterData.filter((mail) =>
          isBetweenTwoToSixMonthsOldFilter(mail.date)
        );
        generateJson(filterDateToAllMails);
        getId(filterDateToAllMails);
      }
      if (valueDate === "isBetweenSixToTwelveMonthsOldFilter") {
        const filterDateToAllMails = filterData.filter((mail) =>
          isBetweenSixToTwelveMonthsOldFilter(mail.date)
        );
        generateJson(filterDateToAllMails);
        getId(filterDateToAllMails);
      }
      if (valueDate === "isBetweenOneToTwoYearsOldFilter") {
        const filterDateToAllMails = filterData.filter((mail) =>
          isBetweenOneToTwoYearsOldFilter(mail.date)
        );
        generateJson(filterDateToAllMails);
        getId(filterDateToAllMails);
      }
      if (valueDate === "isOlderThanTwoYearsFilter") {
        const filterDateToAllMails = filterData.filter((mail) =>
          isOlderThanTwoYearsFilter(mail.date)
        );
        generateJson(filterDateToAllMails);
        getId(filterDateToAllMails);
      }
    }
  }, [valueDate, dataMessages, valueFilter]);

  if (Cookies.get("token") === undefined) {
    return (
      <section>
        <GoogleLogin>
          <div id="signInDiv"></div>
        </GoogleLogin>
      </section>
    );
  }

  if (Cookies.get("keyFetch") === undefined) {
    const personData = jwt_decode(Cookies.get("token"));
    return (
      <section>
        <AppLogin name={personData.name}>
          <button className="text-white text-15" onClick={creatData}>
            Start met je avontuur met het legen van je mail box van{" "}
            {personData.email}
          </button>
        </AppLogin>
      </section>
    );
  }

  if (emails.length === 0) {
    return (
      <section className="flex flex-col h-screen relative">
        <LoadingAnimation />
        <CarAnimation />
        <BundleBackground />
      </section>
    );
  }
  if (valueFilter === undefined) {
    return (
      <section>
        <Main />
      </section>
    );
  }

  if (countedDate === undefined) {
    return (
      <section className="flex flex-col h-screen relative">
        <LoadingAnimation />
        <CarAnimation />
        <BundleBackground />
      </section>
    );
  }

  if (valueFilter && countedDate !== undefined && valueDate === undefined) {
    return (
      <section>
        <MainFilter />
      </section>
    );
  }
  return (
    <section>
      <MainAll />
    </section>
  );
}
export default App;
