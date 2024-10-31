import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useFetch, { CachePolicies } from 'use-http';
import { FormContainer, MultiSelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';
import { Alert, AlertTitle, Stack, Typography, styled } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { MaxWidthText } from '@allenai/varnish2';

import { Answer } from '../api/Answer';
import { Query } from '../api/Query';

/**
 * This type defines the different values that will be accepted from the form's inputs.
 * The names of the keys (Eg. 'question', 'choices') must match
 * the HTML input's declared 'name' attribute.
 *
 * Eg:
 * ``` <Form.Item label="Question:" name="question"> ... </Form.Item>
 *
 * In this example, we aligned the
 * form's 'name' attributes with the keys of the 'Query' type that is used to query the API.
 */
type FormValue = Partial<Query>;

export const Home = () => {
    /**
     * These are react hooks. You can read more about hooks here:
     * @see https://legacy.reactjs.org/docs/hooks-intro.html
     */
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * This fetches an answer by hitting /api/solve, which is defined in
     * api.py. The provided query is serialized and sent across the wire as JSON.
     *
     * usefetch is a library for making HTTP requests.
     * You can find more about it here:
     * @see https://github.com/ava/use-http
     *
     * /api/solve takes a `Query` and returns an `Answer`:
     */
    const {
        post: solvePost,
        response: solveResponse,
        loading: solveLoading,
        error: solveError,
    } = useFetch<Answer>('/api/solve', { cachePolicy: CachePolicies.NO_CACHE });

    const formContext = useForm<{
        question: string;
        choices: string[];
    }>({
        defaultValues: {
            question: undefined,
            choices: undefined,
        },
    });

    /**
     * Submits a call to the API for a given query as defined in the URL parameters
     */
    const fetchAnswer = useCallback(async () => {
        const query = Query.fromQueryString(location.search);

        // ensure that we have the expected parameters in the URL
        if (query.isValid()) {
            // remove empty question and answer options from the form so that the user knows they're not valid
            const cleanedQuery = new Query(
                query.question.trim(),
                query.choices.filter((choice) => choice.trim() !== '')
            );
            formContext.reset(cleanedQuery);

            // Note: validation is occurring on the backend, so errors will be thrown if there are any invalid inputs
            await solvePost(cleanedQuery);
        }
    }, [formContext, location, solvePost]);

    /**
     * This is a lifecycle function that's called by React after the component
     * has first been rendered and specifically when the 'location' data changes.
     *
     * You can read more about React component's lifecycle here:
     * @see https://reactjs.org/docs/state-and-lifecycle.html
     */
    useEffect(() => {
        fetchAnswer().catch((err: unknown) => {
            console.error(err);
        });
    }, [fetchAnswer, location]);

    /**
     * This handler is invoked when the form is submitted, which occurs when
     * the user clicks the submit button or when the user clicks input while
     * the button and/or a form element is selected.
     *
     * We use this instead of a onClick button on a button as it matches the
     * traditional form experience that end users expect.
     *
     * @see https://reactjs.org/docs/forms.html
     */
    const handleSubmit = (values: FormValue) => {
        // We add the query params to the URL, so that users can link to
        // our demo and share noteworthy cases, edge cases, etc.
        const query = new Query(values.question, values.choices);
        // pushing this new URL will automatically trigger a new query (see the 'useEffect' function above)
        navigate(`/?${query.toQueryString()}`);
    };

    /**
     * The render method defines what's rendered. When writing yours keep in
     * mind that you should try to make it a "pure" function of the component's
     * props and state.  In other words, the rendered output should be expressed
     * as a function of the component properties and state.
     *
     * React executes render whenever a component's properties and/or state is
     * updated. The output is then compared with what's rendered and the
     * required updates are made. This is to ensure that rerenders make as few
     * changes to the document as possible -- which can be an expensive process
     * and lead to slow interfaces.
     */
    return (
        <div>
            <h1>Example Demo</h1>
            <MaxWidthText as="p">
                Enter a question and answers below to see what answer our application selects.
            </MaxWidthText>
            <FormStack spacing={2}>
                <FormContainer
                    formContext={formContext}
                    onSuccess={(values) => {
                        handleSubmit(values);
                    }}>
                    <Stack spacing={2}>
                        <TextFieldElement
                            name="question"
                            fullWidth
                            label="Question"
                            multiline
                            placeholder="Enter a question"
                            required
                            rows={4}
                            validation={{
                                required: 'Question is required',
                                minLength: {
                                    value: 5,
                                    message: 'Question must be at least 5 characters long',
                                },
                            }}
                        />
                        <MultiSelectElement
                            fullWidth
                            label="Answers"
                            name="choices"
                            required
                            variant="outlined"
                            options={['Grapefruit', 'Lemon', 'Lime', 'Orange']}
                        />
                        {/* Warning: If you choose to remove this Button's 'loading' attribute, you will be responsible for
                        handling multiple asynchronous requests which could lead to inconsistencies. */}
                        <Button type={'submit'} variant="contained" loading={solveLoading}>
                            Submit
                        </Button>
                    </Stack>
                </FormContainer>

                {solveError ? (
                    <Alert severity="error">
                        {solveError.message || 'Sorry, something went wrong.'}
                    </Alert>
                ) : null}
                {!solveError && solveResponse.data ? (
                    <>
                        <Alert severity="success">
                            <AlertTitle>Our system answered:</AlertTitle>
                            {`${solveResponse.data.answer} (${solveResponse.data.score}%)`}
                        </Alert>
                        <Alert severity="info">
                            <AlertTitle>Debug</AlertTitle>
                            <Typography>Input:</Typography>
                            {JSON.stringify(formContext.getValues(), null, 4)}
                            <Typography>Output:</Typography>
                            {JSON.stringify(solveResponse.data, null, 4)}
                        </Alert>
                    </>
                ) : null}
            </FormStack>
        </div>
    );
};

/**
 * The definition below creates a component that we can use in the render
 * function above that have extended / customized CSS attached to them.
 * Learn more about mui styled:
 * @see https://mui.com/system/styled/
 *
 *
 * CSS is used to modify the display of HTML elements. If you're not familiar
 * with it here's quick introduction:
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS
 */
const FormStack = styled(Stack)`
    max-width: 600px;
`;

/**
 * Makes button not full width
 */
const Button = styled(LoadingButton)`
    width: 130px;
`;
