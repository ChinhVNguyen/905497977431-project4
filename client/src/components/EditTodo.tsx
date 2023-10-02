import * as React from 'react'
import { Form, Button, Input } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { getTodoById, getUploadUrl, uploadFile, patchTodo } from '../api/todos-api'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
}

interface EditTodoProps {
  match: {
    params: {
      todoId: string
    }
  }
  auth: Auth
}

interface EditTodoState {
  file: any
  name:string | undefined
  dueDate: string | undefined
  uploadState: UploadState
  done: boolean
}

export class EditTodo extends React.PureComponent<
  EditTodoProps,
  EditTodoState
> {
  state: EditTodoState = {
    file: undefined,
    name:undefined,
    dueDate:undefined,
    uploadState: UploadState.NoUpload,
    done: false,
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      ...this.state,
      file: files[0]
    })
  }

  handleNamechange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value
    if (!newName) return

    this.setState({
      ...this.state,
      name:newName,
    })
  }

  handleDueDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDueDate = event.target.value
    if (!newDueDate) return
    this.setState({
      ...this.state,
      dueDate:newDueDate,
    })
  }

  handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCheck = event.target.checked
    if (!newCheck) return
    this.setState({
      ...this.state,
      done:newCheck,
    })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.file) {
        alert('File should be selected')
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.props.match.params.todoId)

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadUrl, this.state.file)

      alert('File was uploaded!')
    } catch (e) {
      alert('Could not upload a file: ' + (e as Error).message)
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  handleUpdate = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      
      await patchTodo(this.props.auth.getIdToken(), this.props.match.params.todoId, {name: this.state.name, dueDate: this.state.dueDate, done: this.state.done})
      alert('Update successful!')
    } catch (e) {
      alert('Could not update todo: ' + (e as Error).message)
    }
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }
  async componentDidMount() {
    try {
      const todo = await getTodoById(this.props.auth.getIdToken(), this.props.match.params.todoId)
      if (!Object.keys(todo? todo:{}).length) return
      if (todo) {
        this.setState({
          name: todo.name,
          dueDate: todo.dueDate,
          done: todo.done,
        })
      }
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <h1>Upload new image</h1>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>File</label>
            <input
              type="file"
              accept="image/*"
              placeholder="Image to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>
          {this.renderButton()}
        </Form>
          <Form onSubmit={this.handleUpdate}>
          <Form.Field>
            <label>Name</label>
            <input
              type="text"
              placeholder="Name"
              onChange={this.handleNamechange}
              value={this.state.name}
            />
          </Form.Field>
          <Form.Field>
            <label>Due Date</label>
            <Input
              type='date'
              actionPosition="left"
              onChange={this.handleDueDateChange}
              value={this.state.dueDate}
              style={{border:"1px solid rgba(34,36,38,.15)",borderRadius:"4px"}}
            />
          </Form.Field>
          <Form.Field>
            <label>Finished</label>
            <Input
              type='checkbox'
              actionPosition="left"
              onChange={this.handleCheckboxChange}
              value={this.state.done}
              checked={this.state.done}
              style={{width:"auto"}}
            />
          </Form.Field>
          {this.renderButtonUpdate()}
        </Form>
      </div>
    )
  }

  renderButton() {

    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Upload
        </Button>
      </div>
    )
  }

  renderButtonUpdate() {

    return (
      <div>
        <Button
          type="submit"
        >
          Update
        </Button>
      </div>
    )
  }
}
