import React from 'react';

export default function WritingEditor({ mock, refresh }) {
    return (
        <div className="p-6 bg-white rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Writing Editor</h2>
            <p>Mock ID: {mock.id}</p>
            <p className="text-gray-500">Editor implementation coming soon...</p>
        </div>
    );
}
