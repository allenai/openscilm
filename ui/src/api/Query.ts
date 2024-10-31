/**
 * Representation of a query, which consists of a question and answer choices.
 */
export class Query {
    constructor(
        readonly question: string = '',
        readonly choices: string[] = []
    ) {}

    // defines how the URL will identify the parameters we want to store
    private static readonly questionURLKey = 'q';
    private static readonly choicesURLKey = 'c';

    /**
     * Returns whether the current query has any populated values.
     * This catches scenarios where rogue url strings are provided /?random=badValue
     *
     * @return {boolean}
     */
    isValid() {
        return this.question || this.choices.length;
    }

    /**
     * Serializes the query to a URL appropriate representation.
     *
     * @returns {string}
     */
    toQueryString(): string {
        const params = new URLSearchParams();
        params.set(Query.questionURLKey, this.question);
        // we have to append each selection value in the choices array to the URL
        for (const selection of this.choices) {
            params.append(Query.choicesURLKey, selection);
        }
        return params.toString();
    }

    /**
     * Factory that returns a Query instance based upon the provided URL search parameters.
     *
     * @param {string} searchParams
     *
     * @returns {Query}
     */
    public static fromQueryString(searchParams: string): Query {
        const params = new URLSearchParams(searchParams);
        return new Query(
            params.get(Query.questionURLKey) ?? '',
            params.getAll(Query.choicesURLKey)
        );
    }
}
