export type MessageResponse = {
    message: string;
};

export type ErrorResponse = {
    error: string;
};

export type ApiResponse = MessageResponse | ErrorResponse;

export function isMessageResponse(value: unknown): value is MessageResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'message' in value &&
        typeof value.message === 'string'
    );
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'error' in value &&
        typeof value.error === 'string'
    );
}
