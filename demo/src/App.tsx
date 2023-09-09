import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataverseConnector,
  FolderType,
  StructuredFolders,
  Currency,
  StorageProviderName,
  WALLET,
  RESOURCE,
  SYSTEM_CALL,
} from "@dataverse/dataverse-connector";
import { Contract, ethers } from "ethers";
import { getAddress } from "viem";
import { WalletProvider } from "@dataverse/wallet-provider";
import "./App.scss";
import { Console } from "console";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const dataverseConnector = new DataverseConnector();

export const appId = "319e6aa6-916d-46fc-a7bf-4c4b0cb04919";

const modelId =
  "kjzl6hvfrbw6catndj34fzm0au0qu8dznn6wtrrdmd4va7052ffiypywqd8fjg9";

const postVersion = "0.0.1";

const storageProvider = {
  name: StorageProviderName.Lighthouse,
  apiKey: "70210a3d.7d6010e2426544c58c55979cb4063428", // input your api key
};

function App() {
  const [address, setAddress] = useState("");
  const [wallet, setWallet] = useState<WALLET>();
  const [pkh, setPkh] = useState("");
  const [currentPkh, setCurrentPkh] = useState("");
  const [pkpWallet, setPKPWallet] = useState({
    address: "",
    publicKey: "",
  });
  const [litActionResponse, setLitActionResponse] = useState("");

  const [isCurrentPkhValid, setIsCurrentPkhValid] = useState<boolean>();
  const [appListInfo, setAppListInfo] = useState<string>("");
  const [appInfo, setAppInfo] = useState<string>("");

  const [streamId, setStreamId] = useState("");
  const [folderId, setFolderId] = useState("");
  const [indexFileId, setIndexFileId] = useState("");
  const [folders, setFolders] = useState<StructuredFolders>();
  const [
    dataverseProviderHasAddedListener,
    setDataverseProviderHasAddedListener,
  ] = useState<boolean>();

  const [provider, setProvider] = useState<WalletProvider>();

  const [uploadFileLink, setUploadFileLink] = useState("");

  const navigate = useNavigate();

  /*** Wallet ***/
  const connectWalletWithDataverseProvider = async (_wallet = wallet) => {
    const provider = new WalletProvider();
    console.log(provider);
    const res = await dataverseConnector.connectWallet({
      ...(_wallet !== WALLET.EXTERNAL_WALLET && { wallet: _wallet }),
      provider,
    });
    console.log(res);
    setProvider(provider);
    setWallet(res.wallet);
    setAddress(res.address);
    if (!dataverseProviderHasAddedListener) {
      provider.on("chainChanged", (chainId: number) => {
        console.log(chainId);
      });
      provider.on("chainNameChanged", (chainName: string) => {
        console.log(chainName);
      });
      provider.on("accountsChanged", (accounts: Array<string>) => {
        console.log(accounts);
        setAddress(accounts[0]);
      });
      setDataverseProviderHasAddedListener(true);
    }
    setRenderUpload(true);
    return res;
  };

  const connectWalletWithMetamaskProvider = async (_wallet = wallet) => {
    const provider = (window as any).ethereum;
    console.log(provider);
    const res = await dataverseConnector.connectWallet({
      wallet: _wallet,
      provider,
    });
    console.log(res);
    setProvider(provider);
    setWallet(WALLET.EXTERNAL_WALLET);
    setAddress(res.address);
    provider.on("chainChanged", (networkId: string) => {
      console.log(Number(networkId));
    });
    provider.on("accountsChanged", (accounts: Array<string>) => {
      console.log(accounts);
      setAddress(getAddress(accounts[0]));
    });
    return res;
  };

  const getCurrentWallet = async () => {
    const res = await dataverseConnector.getCurrentWallet();
    if (res) {
      if (res.wallet !== WALLET.EXTERNAL_WALLET) {
        await connectWalletWithDataverseProvider(res.wallet);
      } else {
        await connectWalletWithMetamaskProvider(res.wallet);
      }
    } else {
      console.log(res);
    }
    return res;
  };

  const switchNetwork = async () => {
    if (!dataverseConnector?.isConnected) {
      console.error("please connect wallet first");
      return;
    }

    await provider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }],
    });
  };

  const signOrSignTypedData = async () => {
    if (!dataverseConnector?.isConnected) {
      console.error("please connect wallet first");
      return;
    }

    const res = await provider?.request({
      method: "personal_sign",
      params: [address, "test"],
    });

    console.log(res);

    await provider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }],
    });

    const res2 = await provider?.request({
      method: "eth_signTypedData_v4",
      params: [
        address,
        JSON.stringify({
          domain: {
            name: "EPNS COMM V1",
            chainId: 80001,
            verifyingContract: "0xb3971BCef2D791bc4027BbfedFb47319A4AAaaAa",
          },
          primaryType: "Data",
          types: {
            Data: [
              {
                name: "data",
                type: "string",
              },
            ],
            EIP712Domain: [
              {
                name: "name",
                type: "string",
              },
              {
                name: "chainId",
                type: "uint256",
              },
              {
                name: "verifyingContract",
                type: "address",
              },
            ],
          },
          message: {
            data: '2+{"notification":{"title":"Push Title Hello","body":"Good to see you bodies"},"data":{"acta":"","aimg":"","amsg":"Payload Push Title Hello Body","asub":"Payload Push Title Hello","type":"1"},"recipients":"eip155:5:0x6ed14ee482d3C4764C533f56B90360b767d21D5E"}',
          },
        }),
      ],
    });

    console.log(res2);
  };

  const sendTransaction = async () => {
    if (!dataverseConnector?.isConnected) {
      console.error("please connect wallet first");
      return;
    }
    const res = await provider?.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: dataverseConnector.address, // The user's active address.
          to: dataverseConnector.address, // Required except during contract publications.
          value: "0xE8D4A50FFD41E", // Only required to send ether to the recipient from the initiating external account.
          // gasPrice: "0x09184e72a000", // Customizable by the user during MetaMask confirmation.
          // gas: "0x2710", // Customizable by the user during MetaMask confirmation.
        },
      ],
    });
    console.log(res);
  };

  const contractCall = async () => {
    if (!dataverseConnector?.isConnected) {
      console.error("please connect wallet first");
      return;
    }

    await provider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }],
    });

    const contractAddress = "0x2e43c080B56c644F548610f45998399d42e3d400";

    const abi = [
      {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "value_",
            type: "uint256",
          },
        ],
        name: "setValue",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "value",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ];

    const ethersProvider = new ethers.providers.Web3Provider(provider!);

    const ethersSigner = ethersProvider.getSigner();

    const contract = new Contract(contractAddress, abi, ethersSigner);

    const res = await contract.setValue(12345);
    console.log(res);

    const tx = await res.wait();
    console.log(tx);

    const value = await contract.value();
    console.log(value);

    return tx;
  };

  const getCurrentPkh = async () => {
    const res = dataverseConnector.getCurrentPkh();
    console.log(res);
    setCurrentPkh(res);
  };

  const getPKP = async () => {
    const res = await dataverseConnector.runOS({ method: SYSTEM_CALL.getPKP });
    console.log(res);
    setPKPWallet(res);
  };

  const executeLitAction = async () => {
    //   const LIT_ACTION_CALL_CODE = `(async () => {
    //     const latestNonce = await Lit.Actions.getLatestNonce({ address, chain });
    //     Lit.Actions.setResponse({response: JSON.stringify({latestNonce})});
    // })();`;
    //   const executeJsArgs = {
    //     code: LIT_ACTION_CALL_CODE,
    //     jsParams: {
    //       address: pkpWallet.address,
    //       chain: "mumbai",
    //     },
    //   };
    //   const res = await dataverseConnector.executeLitAction(executeJsArgs);
    //   console.log(res);
    //   setLitActionResponse(JSON.stringify(res));

    const LIT_ACTION_SIGN_CODE = `(async () => {
        const sigShare = await Lit.Actions.signEcdsa({ toSign, publicKey , sigName });
        Lit.Actions.setResponse({response: JSON.stringify({sigShare})});
    })();`;
    const executeJsArgs = {
      code: LIT_ACTION_SIGN_CODE,
      jsParams: {
        toSign: [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100],
        publicKey: pkpWallet.publicKey,
        sigName: "sig1",
      },
    };
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.executeLitAction,
      params: executeJsArgs,
    });
    console.log(res);
    setLitActionResponse(JSON.stringify(res));
  };
  /*** Wallet ***/

  /*** DApp ***/
  const getDAppTable = async () => {
    const appsInfo = await dataverseConnector.getDAppTable();
    console.log(appsInfo);
    setAppListInfo(`${appsInfo.length} results show in console.`);
  };

  const getDAppInfo = async () => {
    const appInfo = await dataverseConnector.getDAppInfo(appId);
    console.log(appInfo);
    setAppInfo(`1 result show in console.`);
    return appInfo;
  };

  const getValidAppCaps = async () => {
    const appsInfo = await dataverseConnector.runOS({
      method: SYSTEM_CALL.getValidAppCaps,
    });
    console.log(appsInfo);
  };

  const getModelBaseInfo = async () => {
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.getModelBaseInfo,
      params: modelId,
    });
    console.log(res);
  };
  /*** DApp ***/

  /*** Stream ***/
  const createCapability = async () => {
    const pkh = await dataverseConnector.runOS({
      method: SYSTEM_CALL.createCapability,
      params: {
        appId,
        resource: RESOURCE.CERAMIC,
      },
    });
    setPkh(pkh);
    console.log(pkh);
    return pkh;
  };

  const checkCapability = async () => {
    const isCurrentPkhValid = await dataverseConnector.runOS({
      method: SYSTEM_CALL.checkCapability,
      params: {
        appId,
      },
    });
    console.log(isCurrentPkhValid);
    setIsCurrentPkhValid(isCurrentPkhValid);
  };

  const createStream = async () => {
    const date = new Date().toISOString();

    const encrypted = JSON.stringify({
      text: false,
      images: false,
      videos: false,
    });

    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.createStream,
      params: {
        modelId,
        streamContent: {
          appVersion: postVersion,
          text: "hello",
          images: [
            "https://bafkreib76wz6wewtkfmp5rhm3ep6tf4xjixvzzyh64nbyge5yhjno24yl4.ipfs.w3s.link",
          ],
          videos: [],
          createdAt: date,
          updatedAt: date,
          encrypted,
        },
      },
    });

    setStreamId(res.streamId);
    setIndexFileId(res.streamContent.file.indexFileId);
    console.log(res);
  };

  const updateStream = async () => {
    const date = new Date().toISOString();

    const encrypted = JSON.stringify({
      text: true,
      images: true,
      videos: false,
    });

    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.updateStream,
      params: {
        streamId,
        streamContent: {
          appVersion: postVersion,
          text: "hello",
          images: [
            "https://bafkreib76wz6wewtkfmp5rhm3ep6tf4xjixvzzyh64nbyge5yhjno24yl4.ipfs.w3s.link",
          ],
          videos: [],
          createdAt: date,
          updatedAt: date,
          encrypted,
        },
      },
    });
    console.log(res);
  };

  const loadStream = async () => {
    const stream = await dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStream,
      params: streamId,
    });
    console.log(stream);
  };

  const loadStreamsBy = async () => {
    const streams = await dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStreamsBy,
      params: {
        modelId,
        pkh,
      },
    });
    console.log(streams);
    // const res = Object.values(streams).filter(
    //   (el) => el.controller !== pkh && el.fileType === FileType.Datatoken
    // );
    // console.log(res);
  };
  /*** Stream ***/

  /*** Folders ***/
  const readFolders = async () => {
    const folders = await dataverseConnector.runOS({
      method: SYSTEM_CALL.readFolders,
    });
    setFolders(folders);
    console.log({ folders });
    return folders;
  };

  const createFolder = async () => {
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.createFolder,
      params: {
        folderType: FolderType.Private,
        folderName: "Private",
      },
    });
    console.log(res);
    setFolderId(res.newFolder.folderId);
    console.log(res.newFolder.folderId);
  };

  const updateFolderBaseInfo = async () => {
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.updateFolderBaseInfo,
      params: {
        folderId,
        newFolderName: new Date().toISOString(),
        newFolderDescription: new Date().toISOString(),
      },
    });
    console.log(res);
  };

  const readFolderById = async () => {
    const folder = await dataverseConnector.runOS({
      method: SYSTEM_CALL.readFolderById,
      params: folderId,
    });
    console.log({ folder });
    return folder;
  };

  const deleteFolder = async () => {
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.deleteFolder,
      params: { folderId },
    });
    console.log(res);
  };

  const deleteAllFolder = async () => {
    if (!folders) {
      throw "Please call readFolders first";
    }
    await Promise.all(
      Object.keys(folders).map(folderId =>
        dataverseConnector.runOS({
          method: SYSTEM_CALL.deleteFolder,
          params: { folderId },
        }),
      ),
    );
  };

  const getDefaultFolderId = async () => {
    if (!folders) {
      throw "Please call readFolders first";
    }
    const { defaultFolderName } = await getDAppInfo();
    const folder = Object.values(folders).find(
      folder => folder.options.folderName === defaultFolderName,
    );
    return folder!.folderId;
  };
  /*** Folders ***/

  /*** Files ***/
  const uploadFile = async (event: any) => {
    try {
      const file = event.target.files[0];
      console.log(file);
      const fileName = file.name;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      const fileBase64: string = await new Promise(resolve => {
        reader.addEventListener("load", async (e: any) => {
          resolve(e.target.result);
        });
      });

      console.log(fileBase64);
      // var binaryString = atob(fileBase64.split(",")[1]);
      // console.log(binaryString);
      // var bytes = new Uint8Array(binaryString.length);
      // for (var i = 0; i < binaryString.length; i++) {
      //   bytes[i] = binaryString.charCodeAt(i);
      // }
      // console.log(bytes);
      // console.log(bytes.buffer);
      const res = await dataverseConnector.runOS({
        method: SYSTEM_CALL.uploadFile,
        params: {
          folderId,
          fileBase64,
          fileName,
          encrypted: false,
          storageProvider,
        },
      });
      setIndexFileId(res.newFile.indexFileId);
      const uploadedFileId = res.newFile.contentId;
      if (uploadedFileId) {
        setUploadFileLink(
          `https://ebookverse.netlify.app/?param1=${uploadedFileId}`,
        );
        notify();
      }

      console.log(uploadedFileId);
      // console.log(res); bsdk
    } catch (error) {
      console.error(error);
    }
  };

  const updateFileBaseInfo = async () => {
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.updateFileBaseInfo,
      params: {
        indexFileId,
        fileInfo: {
          mirrorName: "aaa",
        },
      },
    });
    console.log(res);
  };

  const moveFiles = async () => {
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.moveFiles,
      params: {
        targetFolderId: folderId || (await getDefaultFolderId()),
        sourceIndexFileIds: [indexFileId],
      },
    });
    console.log(res);
  };

  const monetizeFile = async () => {
    try {
      if (!pkh) {
        throw "You must connect capability";
      }
      const profileId = await getProfileId({
        pkh,
        lensNickName: "hello123456",
      });

      const res = await dataverseConnector.runOS({
        method: SYSTEM_CALL.monetizeFile,
        params: {
          ...(indexFileId ? { indexFileId } : { streamId }),
          datatokenVars: {
            profileId,
            collectLimit: 100,
            amount: 0.0001,
            currency: Currency.WMATIC,
          },
          // decryptionConditions: [
          //   [
          //     {
          //       conditionType: "evmBasic",
          //       contractAddress: "",
          //       standardContractType: "",
          //       chain: "filecoin",
          //       method: "",
          //       parameters: [":userAddress"],
          //       returnValueTest: {
          //         comparator: "=",
          //         value: "0xd10d5b408A290a5FD0C2B15074995e899E944444",
          //       },
          //     },
          //     { operator: "or" },
          //     {
          //       conditionType: "evmBasic",
          //       contractAddress: "",
          //       standardContractType: "",
          //       chain: "filecoin",
          //       method: "",
          //       parameters: [":userAddress"],
          //       returnValueTest: {
          //         comparator: "=",
          //         value: "0x3c6216caE32FF6691C55cb691766220Fd3f55555",
          //       },
          //     },
          //   ] as any,
          // ], // Only sell to specific users
        },
      });

      console.log(res);
      return res;
    } catch (error) {
      console.error(error);
    }
  };

  const removeFiles = async () => {
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.removeFiles,
      params: {
        indexFileIds: [indexFileId],
      },
    });
    console.log(res);
  };
  /*** Files ***/

  /*** Monetize ***/
  const createProfile = async () => {
    await provider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }],
    });
    const res = await dataverseConnector.createProfile("test01");
    console.log(res);
  };

  const getProfiles = async () => {
    const res = await dataverseConnector.getProfiles(address);
    console.log(res);
  };

  const getProfileId = async ({
    pkh,
    lensNickName,
  }: {
    pkh: string;
    lensNickName?: string;
  }) => {
    const lensProfiles = await dataverseConnector.getProfiles(
      pkh.slice(pkh.lastIndexOf(":") + 1),
    );

    let profileId;
    if (lensProfiles?.[0]?.id) {
      profileId = lensProfiles?.[0]?.id;
    } else {
      if (!lensNickName) {
        throw "Please pass in lensNickName";
      }
      if (!/^[\da-z]{5,26}$/.test(lensNickName) || lensNickName.length > 26) {
        throw "Only supports lower case characters, numbers, must be minimum of 5 length and maximum of 26 length";
      }
      profileId = await dataverseConnector.createProfile(lensNickName);
    }

    return profileId;
  };

  const unlock = async () => {
    try {
      // const indexFileId =
      //   "kjzl6kcym7w8y8k0cbuzlcrd78o1jpjohqj6tnrakwdq0vklbek5nhj55g2c4se";
      const res = await dataverseConnector.runOS({
        method: SYSTEM_CALL.unlock,
        params: {
          ...(indexFileId ? { indexFileId } : { streamId }),
        },
      });
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  };

  const isCollected = async () => {
    const datatokenId = "0xD0f57610CA33A86d1A9C8749CbEa027fDCff3575";
    const address = "0xdC4b09aBf7dB2Adf6C5b4d4f34fd54759aAA5Ccd";
    const res = await dataverseConnector.isCollected({
      datatokenId,
      address,
    });
    console.log(res);
  };

  const getDatatokenBaseInfo = async () => {
    const datatokenId = "0xD0f57610CA33A86d1A9C8749CbEa027fDCff3575";
    const res = await dataverseConnector.getDatatokenBaseInfo(datatokenId);
    console.log(res);
  };
  /*** Monetize ***/

  const notify = () =>
    toast.success("EBook published!", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

  const [renderUpload, setRenderUpload] = useState(false);

  return (
    <div className='App'>
      <div className='ud-header absolute top-0 left-0 z-40 flex w-full items-center bg-transparent'>
        <div className='container'>
          <div className='relative -mx-4 flex items-center justify-between'>
            <div className='w-60 px-4'>
              <a href='index.html' className='navbar-logo block w-full py-5'>
                <img
                  src='assets/images/logo/logo-white.svg'
                  alt=''
                  className='header-logo w-full'
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        id='home'
        className='relative overflow-hidden bg-primary pt-[120px] md:pt-[130px] lg:pt-[160px]'
      >
        <div className='container'>
          <div className='-mx-4 flex flex-wrap items-center'>
            <div className='w-full px-4'>
              <div
                className='hero-content wow fadeInUp mx-auto max-w-[780px] text-center'
                data-wow-delay='.2s'
              >
                <h1 className='mb-8 text-3xl font-bold leading-snug text-white sm:text-4xl sm:leading-snug md:text-[45px] md:leading-snug'>
                  Share your konwledge with BookVerse
                </h1>
                <p className='mx-auto mb-10 max-w-[600px] text-base text-[#e4e4e4] sm:text-lg sm:leading-relaxed md:text-xl md:leading-relaxed'>
                  Upload and share your E-Book to dcentralized storage powered
                  by dataverse
                </p>
              </div>
            </div>
            <div className='w-full px-4'>
              <div
                className='wow fadeInUp relative z-10 mx-auto max-w-[845px]'
                data-wow-delay='.25s'
              >
                <div className='mt-16'>
                  <img
                    src='assets/images/hero/hero-image.jpg'
                    alt=''
                    className='mx-auto max-w-full rounded-t-xl rounded-tr-xl'
                  />
                </div>
                <div className='absolute bottom-0 -left-9 z-[-1]'>
                  <svg
                    width={134}
                    height={106}
                    viewBox='0 0 134 106'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <circle
                      cx='1.66667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 1.66667 104)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 16.3333 104)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 31 104)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 45.6667 104)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 60.3333 104)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 88.6667 104)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 117.667 104)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 74.6667 104)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 103 104)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 132 104)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='89.3333'
                      r='1.66667'
                      transform='rotate(-90 1.66667 89.3333)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='89.3333'
                      r='1.66667'
                      transform='rotate(-90 16.3333 89.3333)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='89.3333'
                      r='1.66667'
                      transform='rotate(-90 31 89.3333)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='89.3333'
                      r='1.66667'
                      transform='rotate(-90 45.6667 89.3333)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 60.3333 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 88.6667 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 117.667 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 74.6667 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 103 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 132 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='74.6673'
                      r='1.66667'
                      transform='rotate(-90 1.66667 74.6673)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='31.0003'
                      r='1.66667'
                      transform='rotate(-90 1.66667 31.0003)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 16.3333 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='31.0003'
                      r='1.66667'
                      transform='rotate(-90 16.3333 31.0003)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 31 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='31.0003'
                      r='1.66667'
                      transform='rotate(-90 31 31.0003)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 45.6667 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='31.0003'
                      r='1.66667'
                      transform='rotate(-90 45.6667 31.0003)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 60.3333 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 60.3333 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 88.6667 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 88.6667 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 117.667 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 117.667 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 74.6667 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 74.6667 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 103 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 103 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 132 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 132 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 1.66667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 1.66667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 16.3333 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 16.3333 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 31 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 31 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 45.6667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 45.6667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 60.3333 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 60.3333 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 88.6667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 88.6667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 117.667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 117.667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 74.6667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 74.6667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 103 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 103 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 132 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 132 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='45.3336'
                      r='1.66667'
                      transform='rotate(-90 1.66667 45.3336)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='1.66683'
                      r='1.66667'
                      transform='rotate(-90 1.66667 1.66683)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='45.3336'
                      r='1.66667'
                      transform='rotate(-90 16.3333 45.3336)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='1.66683'
                      r='1.66667'
                      transform='rotate(-90 16.3333 1.66683)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='45.3336'
                      r='1.66667'
                      transform='rotate(-90 31 45.3336)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='1.66683'
                      r='1.66667'
                      transform='rotate(-90 31 1.66683)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='45.3336'
                      r='1.66667'
                      transform='rotate(-90 45.6667 45.3336)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='1.66683'
                      r='1.66667'
                      transform='rotate(-90 45.6667 1.66683)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 60.3333 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 60.3333 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 88.6667 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 88.6667 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 117.667 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 117.667 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 74.6667 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 74.6667 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 103 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 103 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 132 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 132 1.66707)'
                      fill='white'
                    />
                  </svg>
                </div>
                <div className='absolute -top-6 -right-6 z-[-1]'>
                  <svg
                    width={134}
                    height={106}
                    viewBox='0 0 134 106'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <circle
                      cx='1.66667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 1.66667 104)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 16.3333 104)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 31 104)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 45.6667 104)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 60.3333 104)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 88.6667 104)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 117.667 104)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 74.6667 104)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 103 104)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy={104}
                      r='1.66667'
                      transform='rotate(-90 132 104)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='89.3333'
                      r='1.66667'
                      transform='rotate(-90 1.66667 89.3333)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='89.3333'
                      r='1.66667'
                      transform='rotate(-90 16.3333 89.3333)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='89.3333'
                      r='1.66667'
                      transform='rotate(-90 31 89.3333)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='89.3333'
                      r='1.66667'
                      transform='rotate(-90 45.6667 89.3333)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 60.3333 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 88.6667 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 117.667 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 74.6667 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 103 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='89.3338'
                      r='1.66667'
                      transform='rotate(-90 132 89.3338)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='74.6673'
                      r='1.66667'
                      transform='rotate(-90 1.66667 74.6673)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='31.0003'
                      r='1.66667'
                      transform='rotate(-90 1.66667 31.0003)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 16.3333 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='31.0003'
                      r='1.66667'
                      transform='rotate(-90 16.3333 31.0003)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 31 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='31.0003'
                      r='1.66667'
                      transform='rotate(-90 31 31.0003)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 45.6667 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='31.0003'
                      r='1.66667'
                      transform='rotate(-90 45.6667 31.0003)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 60.3333 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 60.3333 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 88.6667 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 88.6667 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 117.667 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 117.667 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 74.6667 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 74.6667 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 103 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 103 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='74.6668'
                      r='1.66667'
                      transform='rotate(-90 132 74.6668)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='31.0001'
                      r='1.66667'
                      transform='rotate(-90 132 31.0001)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 1.66667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 1.66667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 16.3333 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 16.3333 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 31 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 31 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 45.6667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 45.6667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 60.3333 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 60.3333 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 88.6667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 88.6667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 117.667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 117.667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 74.6667 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 74.6667 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 103 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 103 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='60.0003'
                      r='1.66667'
                      transform='rotate(-90 132 60.0003)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='16.3336'
                      r='1.66667'
                      transform='rotate(-90 132 16.3336)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='45.3336'
                      r='1.66667'
                      transform='rotate(-90 1.66667 45.3336)'
                      fill='white'
                    />
                    <circle
                      cx='1.66667'
                      cy='1.66683'
                      r='1.66667'
                      transform='rotate(-90 1.66667 1.66683)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='45.3336'
                      r='1.66667'
                      transform='rotate(-90 16.3333 45.3336)'
                      fill='white'
                    />
                    <circle
                      cx='16.3333'
                      cy='1.66683'
                      r='1.66667'
                      transform='rotate(-90 16.3333 1.66683)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='45.3336'
                      r='1.66667'
                      transform='rotate(-90 31 45.3336)'
                      fill='white'
                    />
                    <circle
                      cx={31}
                      cy='1.66683'
                      r='1.66667'
                      transform='rotate(-90 31 1.66683)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='45.3336'
                      r='1.66667'
                      transform='rotate(-90 45.6667 45.3336)'
                      fill='white'
                    />
                    <circle
                      cx='45.6667'
                      cy='1.66683'
                      r='1.66667'
                      transform='rotate(-90 45.6667 1.66683)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 60.3333 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx='60.3333'
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 60.3333 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 88.6667 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx='88.6667'
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 88.6667 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 117.667 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx='117.667'
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 117.667 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 74.6667 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx='74.6667'
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 74.6667 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 103 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx={103}
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 103 1.66707)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='45.3338'
                      r='1.66667'
                      transform='rotate(-90 132 45.3338)'
                      fill='white'
                    />
                    <circle
                      cx={132}
                      cy='1.66707'
                      r='1.66667'
                      transform='rotate(-90 132 1.66707)'
                      fill='white'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <button onClick={notify}>Notify!</button> */}
      <ToastContainer
        position='top-right'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='dark'
      />

      <button
        className='wallet'
        onClick={() => connectWalletWithDataverseProvider()}
      >
        Connect Dataverse Wallet
      </button>

      {renderUpload ? (
        <button>
          <span>uploadFile</span>
          <input
            type='file'
            accept='.pdf'
            onChange={uploadFile}
            name='uploadFile'
            style={{ width: "168px", marginLeft: "10px" }}
          />
        </button>
      ) : null}
      {/* <button>
        <span>uploadFile</span>
        <input
          type='file'
          accept='.pdf'
          onChange={uploadFile}
          name='uploadFile'
          style={{ width: "168px", marginLeft: "10px" }}
        />
      </button> */}

      <p>
        Upload file link:{" "}
        <a href={uploadFileLink} target='_blank'>
          {uploadFileLink}
        </a>
      </p>
    </div>
  );
}

export default App;
