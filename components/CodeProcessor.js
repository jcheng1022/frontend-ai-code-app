'use client'

import React, {useState} from 'react';
import {CodeiumEditor} from "@codeium/react-code-editor";
import APIClient from "@/services/api";
import {CopyBlock, dracula} from "react-code-blocks";
import {notification} from "antd";
import {useQueryClient} from "@tanstack/react-query";
import {useCurrentUser} from "@/hooks/user.hooks";

const languageOptions = [
    {
        value: 'javascript',
        label: 'Javascript'

    },
    // {
    //     value: 'python',
    //     label: 'Python'
    // }
]
const CodeProcessor = () => {
    const [form, setForm] = useState({
        code: "",
        language: 'javascript',
        theme: 'vs-dark',
    })
    const [loading, setLoading] = useState(false)
    const [api, contextHolder] = notification.useNotification();
    const client = useQueryClient();
    const {data: user} = useCurrentUser();


    const [response, setResponse] = useState(null)


    const handleSubmit = () => {

        if (!!loading) return;


        setLoading(true)
        api.info({
            duration: null,
            key: "loading-notification",
            className:"text-white",
            message: <div className={'text-white'}> Generating...</div>,
            description: <div className={'text-white'}> Please be patient as we generate your unit tests</div>,
            placement: "bottomRight",
        });
        return APIClient.api.post('/task/generate', {
            data: form.code
        }).then(async (data) => {
            await api.open({
                key:"loading-notification",
                className:"text-white",
                type: "success",
                message: <div className={'text-white'}> Finished!</div>,
                description: <div className={'text-white'}> Your unit tests have been generated, please be sure to review them yourself.</div>,
                placement: "bottomRight",
            });
            await client.refetchQueries({
                queryKey: ['usage', user?.id, {}]
            })
            setResponse(data)

        }).catch((e) => {
            if (e.message === "Daily usage limit reached") {
                api.open({
                    key:"loading-notification",
                    className:"text-white",
                    message: <div className={'text-white'}> Usage limit reached</div>,
                    description: <div className={'text-white'}> As we are in early stages, we unfortunately have to limit users to 2 request a day.</div>,
                    placement: "bottomRight",
                });

            } else if (e.message === "Weekly usage limit reached") {
                api.open({
                    key:"loading-notification",
                    className:"text-white",
                    message: <div className={'text-white'}> Usage limit reached</div>,
                    description: <div className={'text-white'}> As we are in early stages, we unfortunately have to limit users to 2 request a week.</div>,
                    placement: "bottomRight",
                });

            } else {
                api.info({
                    key:"loading-notification",
                    className:"text-white",
                    message: <div className={'text-white'}> Something went wrong!</div>,
                    description: <div className={'text-white'}>We are unable to generate the unit tests for you. Please try again later </div>,
                    placement: "bottomRight",
                });
            }

        })
            .finally(() => {
            setLoading(false)
        })
    }




    const filterClassName= 'border-2 border-gray-200 hover:border-sky-200 rounded-md p-2 cursor-pointer '
    return (
        <div className={'m-12'}>
            {contextHolder}
            <div>

                {/* NOTE: Temp commented out ; only supporting JS as of now*/}
                {/*<div className={'flex flex-col items-center'}>*/}
                {/*    <div> Language</div>*/}

                {/*    <div className={'flex gap-2'}>*/}
                {/*        {languageOptions.map((option) => (*/}
                {/*            <div key={`language-option-${option.value}`} onClick={() => setForm({*/}
                {/*                ...form,*/}
                {/*                language: option.value*/}
                {/*            })} className={`${filterClassName} ${form.language === option.value ? 'border-blue-500' : ''}`}>{option.label}</div>*/}
                {/*        ))}*/}
                {/*    </div>*/}
                {/*</div>*/}

            </div>
            <CodeiumEditor
                language={form.language}
                // width={'600px'}
                theme={form.theme}
                value={form.code} onChange={(code) => setForm({
                ...form,
                code
            })}/>

            <div className={`${loading ? "cursor-not-allowed" : "cursor-pointer"} min-w-full flex justify-center ${loading ? 'bg-slate-300': 'bg-sky-200'} py-4 px-2 my-4 rounded-2xl font-bold`} onClick={handleSubmit}> {loading ? "Loading..." : "Submit"} </div>

            {response &&
                response?.map((testCase, index) => {
                    return (
                        <div key={`generated-test-${index}`} className={'my-8'}>

                            <CopyBlock theme={dracula} language={'javascript'} text={testCase.test}/>
                            <div> Explanation: {testCase.explanation} </div>
                        </div>
                    )
                })
                }
        </div>
    );
};

export default CodeProcessor;
