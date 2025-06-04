document.addEventListener('DOMContentLoaded', function() {
    // Theme switcher
    const themeSwitch = document.getElementById('checkbox');
    const themeLabel = document.getElementById('theme-label');
    
    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeLabel.textContent = 'Light Mode';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeLabel.textContent = 'Dark Mode';
        }
    });

    // Initialize matrix
    const sizeInput = document.getElementById('size');
    const matrixContainer = document.getElementById('matrix-container');
    const initialGuessContainer = document.getElementById('initial-guess-container');
    
    function createMatrixInputs(size) {
        matrixContainer.innerHTML = '';
        initialGuessContainer.innerHTML = '';
        
        // Create matrix inputs
        for (let i = 0; i < size; i++) {
            const row = document.createElement('div');
            row.className = 'matrix-row';
            
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.placeholder = `a${i+1}${j+1}`;
                input.id = `a${i}${j}`;
                input.value = i === j ? '10' : '1'; // Default diagonal dominant
                
                cell.appendChild(input);
                row.appendChild(cell);
            }
            
            // Add b vector input
            const bCell = document.createElement('div');
            bCell.className = 'matrix-cell';
            bCell.innerHTML = '<span style="margin: 0 5px;">=</span>';
            row.appendChild(bCell);
            
            const bInputCell = document.createElement('div');
            bInputCell.className = 'matrix-cell';
            
            const bInput = document.createElement('input');
            bInput.type = 'number';
            bInput.step = 'any';
            bInput.placeholder = `b${i+1}`;
            bInput.id = `b${i}`;
            bInput.value = '10'; // Default value
            
            bInputCell.appendChild(bInput);
            row.appendChild(bInputCell);
            
            matrixContainer.appendChild(row);
        }
        
        // Create initial guess inputs
        const initialGuessTitle = document.createElement('h3');
        initialGuessTitle.textContent = 'Nilai Awal:';
        initialGuessContainer.appendChild(initialGuessTitle);
        
        const initialGuessRow = document.createElement('div');
        initialGuessRow.className = 'matrix-row';
        
        for (let i = 0; i < size; i++) {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.placeholder = `x${i+1}`;
            input.id = `x${i}`;
            input.value = '0'; // Default initial guess
            
            cell.appendChild(input);
            initialGuessRow.appendChild(cell);
        }
        
        initialGuessContainer.appendChild(initialGuessRow);
    }
    
    sizeInput.addEventListener('change', function() {
        createMatrixInputs(parseInt(this.value));
    });
    
    // Initialize with default size
    createMatrixInputs(parseInt(sizeInput.value));
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', function() {
        createMatrixInputs(parseInt(sizeInput.value));
        document.getElementById('tolerance').value = '0.001';
        document.getElementById('max-iter').value = '100';
        document.getElementById('method-explanation').innerHTML = '<p>Pilih metode untuk melihat penjelasan dan hasil perhitungan.</p>';
        document.getElementById('iterations-table').innerHTML = '';
        document.getElementById('final-result').innerHTML = '';
    });
    
    // Jacobi method
    document.getElementById('jacobi-btn').addEventListener('click', function() {
        solveSystem('jacobi');
    });
    
    // Gauss-Seidel method
    document.getElementById('gauss-seidel-btn').addEventListener('click', function() {
        solveSystem('gauss-seidel');
    });
    
    function solveSystem(method) {
        const size = parseInt(sizeInput.value);
        const tolerance = parseFloat(document.getElementById('tolerance').value);
        const maxIterations = parseInt(document.getElementById('max-iter').value);
        
        // Get matrix A
        const A = [];
        for (let i = 0; i < size; i++) {
            A[i] = [];
            for (let j = 0; j < size; j++) {
                A[i][j] = parseFloat(document.getElementById(`a${i}${j}`).value);
            }
        }
        
        // Get vector b
        const b = [];
        for (let i = 0; i < size; i++) {
            b[i] = parseFloat(document.getElementById(`b${i}`).value);
        }
        
        // Get initial guess
        const x0 = [];
        for (let i = 0; i < size; i++) {
            x0[i] = parseFloat(document.getElementById(`x${i}`).value);
        }
        
        // Validate inputs
        if (!validateInputs(A, b, x0, tolerance, maxIterations)) {
            return;
        }
        
        // Solve the system
        const { iterations, solution, error } = method === 'jacobi' ? 
            jacobiMethod(A, b, x0, tolerance, maxIterations) : 
            gaussSeidelMethod(A, b, x0, tolerance, maxIterations);
        
        // Display results
        displayResults(method, iterations, solution, error, A, b);
    }
    
    function validateInputs(A, b, x0, tolerance, maxIterations) {
        const size = A.length;
        
        // Check for empty fields
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (isNaN(A[i][j])) {
                    alert(`Masukkan nilai yang valid untuk a${i+1}${j+1}`);
                    return false;
                }
            }
            if (isNaN(b[i])) {
                alert(`Masukkan nilai yang valid untuk b${i+1}`);
                return false;
            }
            if (isNaN(x0[i])) {
                alert(`Masukkan nilai yang valid untuk x${i+1} awal`);
                return false;
            }
        }
        
        // Check tolerance
        if (isNaN(tolerance) || tolerance <= 0) {
            alert('Toleransi error harus lebih besar dari 0');
            return false;
        }
        
        // Check max iterations
        if (isNaN(maxIterations) || maxIterations <= 0) {
            alert('Maksimum iterasi harus lebih besar dari 0');
            return false;
        }
        
        return true;
    }
    
    function jacobiMethod(A, b, x0, tolerance, maxIterations) {
        const size = A.length;
        const iterations = [];
        let x = [...x0];
        let iterationCount = 0;
        let error = Infinity;
        
        while (iterationCount < maxIterations && error > tolerance) {
            const xNew = new Array(size).fill(0);
            
            for (let i = 0; i < size; i++) {
                let sum = 0;
                for (let j = 0; j < size; j++) {
                    if (j !== i) {
                        sum += A[i][j] * x[j];
                    }
                }
                xNew[i] = (b[i] - sum) / A[i][i];
            }
            
            // Calculate error (max norm)
            error = 0;
            for (let i = 0; i < size; i++) {
                const currentError = Math.abs(xNew[i] - x[i]);
                if (currentError > error) {
                    error = currentError;
                }
            }
            
            iterations.push({
                iteration: iterationCount + 1,
                x: [...xNew],
                error: error
            });
            
            x = xNew;
            iterationCount++;
        }
        
        return { iterations, solution: x, error };
    }
    
    function gaussSeidelMethod(A, b, x0, tolerance, maxIterations) {
        const size = A.length;
        const iterations = [];
        let x = [...x0];
        let iterationCount = 0;
        let error = Infinity;
        
        while (iterationCount < maxIterations && error > tolerance) {
            const xOld = [...x];
            
            for (let i = 0; i < size; i++) {
                let sum1 = 0;
                for (let j = 0; j < i; j++) {
                    sum1 += A[i][j] * x[j];
                }
                
                let sum2 = 0;
                for (let j = i + 1; j < size; j++) {
                    sum2 += A[i][j] * xOld[j];
                }
                
                x[i] = (b[i] - sum1 - sum2) / A[i][i];
            }
            
            // Calculate error (max norm)
            error = 0;
            for (let i = 0; i < size; i++) {
                const currentError = Math.abs(x[i] - xOld[i]);
                if (currentError > error) {
                    error = currentError;
                }
            }
            
            iterations.push({
                iteration: iterationCount + 1,
                x: [...x],
                error: error
            });
            
            iterationCount++;
        }
        
        return { iterations, solution: x, error };
    }
    
    function displayResults(method, iterations, solution, error, A, b) {
        const methodName = method === 'jacobi' ? 'Jacobi' : 'Gauss-Seidel';
        const size = solution.length;
        
        // Display method explanation
        let explanation = `<h3>Metode ${methodName}</h3>`;
        
        if (method === 'jacobi') {
            explanation += `
                <p>Metode Jacobi adalah metode iteratif untuk menyelesaikan sistem persamaan linear. 
                Rumus iterasi untuk setiap variabel x<sub>i</sub> adalah:</p>
                <p class="formula">x<sub>i</sub><sup>(k+1)</sup> = (b<sub>i</sub> - Σ<sub>j≠i</sub> a<sub>ij</sub>x<sub>j</sub><sup>(k)</sup>) / a<sub>ii</sub></p>
                <p>di mana:</p>
                <ul>
                    <li>x<sub>i</sub><sup>(k+1)</sup> adalah nilai x<sub>i</sub> pada iterasi ke k+1</li>
                    <li>x<sub>j</sub><sup>(k)</sup> adalah nilai x<sub>j</sub> pada iterasi ke k</li>
                    <li>a<sub>ij</sub> adalah elemen matriks A</li>
                    <li>b<sub>i</sub> adalah elemen vektor b</li>
                </ul>
            `;
        } else {
            explanation += `
                <p>Metode Gauss-Seidel adalah pengembangan dari metode Jacobi yang menggunakan nilai 
                terkini yang sudah dihitung dalam iterasi yang sama. Rumus iterasi untuk setiap 
                variabel x<sub>i</sub> adalah:</p>
                <p class="formula">x<sub>i</sub><sup>(k+1)</sup> = (b<sub>i</sub> - Σ<sub>j&lt;i</sub> a<sub>ij</sub>x<sub>j</sub><sup>(k+1)</sup> - Σ<sub>j&gt;i</sub> a<sub>ij</sub>x<sub>j</sub><sup>(k)</sup>) / a<sub>ii</sub></p>
                <p>di mana:</p>
                <ul>
                    <li>x<sub>i</sub><sup>(k+1)</sup> adalah nilai x<sub>i</sub> pada iterasi ke k+1</li>
                    <li>x<sub>j</sub><sup>(k+1)</sup> adalah nilai x<sub>j</sub> yang sudah diupdate dalam iterasi ini</li>
                    <li>x<sub>j</sub><sup>(k)</sup> adalah nilai x<sub>j</sub> dari iterasi sebelumnya</li>
                    <li>a<sub>ij</sub> adalah elemen matriks A</li>
                    <li>b<sub>i</sub> adalah elemen vektor b</li>
                </ul>
            `;
        }
        
        explanation += `
            <p>Iterasi berhenti ketika error maksimum (‖x<sup>(k+1)</sup> - x<sup>(k)</sup>‖<sub>∞</sub>) 
            kurang dari toleransi error atau mencapai maksimum iterasi.</p>
        `;
        
        document.getElementById('method-explanation').innerHTML = explanation;
        
        // Display iterations table
        let tableHTML = `<h3>Proses Iterasi</h3>`;
        tableHTML += `<div class="table-container"><table>`;
        tableHTML += `<tr><th>Iterasi</th>`;
        
        for (let i = 0; i < size; i++) {
            tableHTML += `<th>x<sub>${i+1}</sub></th>`;
        }
        
        tableHTML += `<th>Error</th></tr>`;
        
        iterations.forEach(iter => {
            tableHTML += `<tr><td>${iter.iteration}</td>`;
            
            for (let i = 0; i < size; i++) {
                tableHTML += `<td>${iter.x[i].toFixed(6)}</td>`;
            }
            
            tableHTML += `<td>${iter.error.toExponential(4)}</td></tr>`;
        });
        
        tableHTML += `</table></div>`;
        document.getElementById('iterations-table').innerHTML = tableHTML;
        
        // Display final result
        let resultHTML = `<h3>Hasil Akhir</h3>`;
        resultHTML += `<p>Jumlah iterasi: ${iterations.length}</p>`;
        resultHTML += `<p>Error akhir: ${error.toExponential(4)}</p>`;
        
        resultHTML += `<div class="solution-values"><p>Solusi:</p><ul>`;
        for (let i = 0; i < size; i++) {
            resultHTML += `<li>x<sub>${i+1}</sub> = ${solution[i].toFixed(6)}</li>`;
        }
        resultHTML += `</ul></div>`;
        
        // Verify solution
        resultHTML += `<div class="verification"><p>Verifikasi solusi (A * x = b):</p><ul>`;
        for (let i = 0; i < size; i++) {
            let sum = 0;
            for (let j = 0; j < size; j++) {
                sum += A[i][j] * solution[j];
            }
            resultHTML += `<li>Persamaan ${i+1}: ${sum.toFixed(6)} ≈ ${b[i].toFixed(6)}</li>`;
        }
        resultHTML += `</ul></div>`;
        
        document.getElementById('final-result').innerHTML = resultHTML;
    }
});